// Tests for api/client.ts. They need no backend: axios-mock-adapter answers each call.
// Every case checks the method, the url and the body against backend/docs/api.md
import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

type Client = typeof import('@/api/client');

type RequestCase = {
  name: string;
  method: 'get' | 'post' | 'patch';
  url: string;
  body?: unknown;
  params?: unknown;
  data: unknown;
  call: (client: Client) => Promise<unknown>;
};

const ITEM_ID = 'item-1';
const CLAIM_ID = 'claim-1';
const OK = 200;
const CONFLICT = 409;
const SERVER_ERROR = 500;
const UPDATED_COUNT = 2;

// one row per client function: what it must send, and what it must hand back
const requests: RequestCase[] = [
  {
    name: 'createClaim without a message',
    method: 'post',
    url: `/items/${ITEM_ID}/claims`,
    body: {},
    data: { id: CLAIM_ID, itemId: ITEM_ID, status: 'pending' },
    call: (c) => c.createClaim({ itemId: ITEM_ID }),
  },
  {
    name: 'createClaim with a message',
    method: 'post',
    url: `/items/${ITEM_ID}/claims`,
    body: { message: 'Still available?' },
    data: { id: CLAIM_ID, itemId: ITEM_ID, status: 'pending' },
    call: (c) =>
      c.createClaim({ itemId: ITEM_ID, message: 'Still available?' }),
  },
  {
    name: 'getItemClaims with a status filter',
    method: 'get',
    url: `/items/${ITEM_ID}/claims`,
    params: { status: 'pending' },
    data: [],
    call: (c) => c.getItemClaims({ itemId: ITEM_ID, status: 'pending' }),
  },
  {
    name: 'updateClaim',
    method: 'patch',
    url: `/claims/${CLAIM_ID}`,
    body: { status: 'approved' },
    data: { id: CLAIM_ID, status: 'approved' },
    call: (c) => c.updateClaim({ claimId: CLAIM_ID, status: 'approved' }),
  },
  {
    name: 'cancelClaim',
    method: 'patch',
    url: `/claims/${CLAIM_ID}/cancel`,
    data: { id: CLAIM_ID, status: 'cancelled' },
    call: (c) => c.cancelClaim({ claimId: CLAIM_ID }),
  },
  {
    name: 'updateClaimNoShow',
    method: 'patch',
    url: `/claims/${CLAIM_ID}/no-show`,
    data: { id: CLAIM_ID, status: 'no_show' },
    call: (c) => c.updateClaimNoShow({ claimId: CLAIM_ID }),
  },
  {
    name: 'updateClaimPickedUp',
    method: 'patch',
    url: `/items/${ITEM_ID}/picked-up`,
    data: { id: ITEM_ID, status: 'picked_up' },
    call: (c) => c.updateClaimPickedUp({ itemId: ITEM_ID }),
  },
  {
    name: 'sendMessage',
    method: 'post',
    url: `/claims/${CLAIM_ID}/messages`,
    body: { body: 'Hello' },
    data: { id: 'm-1', claimId: CLAIM_ID, body: 'Hello', readAt: null },
    call: (c) => c.sendMessage({ claimId: CLAIM_ID, body: 'Hello' }),
  },
  {
    name: 'getMessages',
    method: 'get',
    url: `/claims/${CLAIM_ID}/messages`,
    data: [],
    call: (c) => c.getMessages({ claimId: CLAIM_ID }),
  },
  {
    name: 'readMessage',
    method: 'patch',
    url: `/claims/${CLAIM_ID}/messages/read`,
    data: { updatedCount: UPDATED_COUNT },
    call: (c) => c.readMessage({ claimId: CLAIM_ID }),
  },
];

describe('api client', () => {
  let client: Client;
  let mock: AxiosMockAdapter;

  beforeAll(async () => {
    // client.ts reads these when it loads, so they are set before it is imported
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('VITE_USE_MOCKED_API_CALLS', 'false');
    client = await import('@/api/client');
    mock = new AxiosMockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
    vi.unstubAllEnvs();
  });

  it.each(requests)(
    '$name sends $method $url and returns the data',
    async (testCase) => {
      mock
        .onAny(testCase.url)
        .reply(OK, { success: true, data: testCase.data });

      const result = await testCase.call(client);

      expect(result).toEqual(testCase.data);

      // the answer only matches when the url matches, so check the method and the body too
      const [sent] = mock.history[testCase.method] ?? [];
      expect(sent).toBeDefined();
      if (testCase.body !== undefined) {
        expect(JSON.parse(sent?.data)).toEqual(testCase.body);
      }
      if (testCase.params !== undefined) {
        expect(sent?.params).toEqual(testCase.params);
      }
    },
  );

  it('throws an ApiRequestError with the status and the server message on an error answer', async () => {
    mock
      .onPost(`/items/${ITEM_ID}/claims`)
      .reply(CONFLICT, { success: false, message: 'Already claimed' });

    const attempt = client.createClaim({ itemId: ITEM_ID });

    await expect(attempt).rejects.toBeInstanceOf(client.ApiRequestError);
    await expect(attempt).rejects.toMatchObject({
      status: CONFLICT,
      message: 'Already claimed',
    });
  });

  it('falls back to a generic message when the error answer has none', async () => {
    mock.onGet('/categories').reply(SERVER_ERROR, {});

    await expect(client.getCategories()).rejects.toMatchObject({
      status: SERVER_ERROR,
      message: `Request failed (${SERVER_ERROR})`,
    });
  });

  it('throws a readable error when the server cannot be reached', async () => {
    mock.onGet('/categories').networkError();

    await expect(client.getCategories()).rejects.toMatchObject({
      message: 'Could not reach the server. Please try again.',
    });
  });

  it('sends the csrf token from login on later requests', async () => {
    mock.onPost('/users/logon').reply(OK, {
      success: true,
      data: { user: { id: 'u-1' }, csrfToken: 'token-123' },
    });
    mock
      .onPatch(`/claims/${CLAIM_ID}/cancel`)
      .reply(OK, { success: true, data: { id: CLAIM_ID } });

    await client.logonUser({ email: 'a@b.c', password: 'x' });
    await client.cancelClaim({ claimId: CLAIM_ID });

    const [sent] = mock.history.patch ?? [];
    expect(sent?.headers?.['X-CSRF-TOKEN']).toBe('token-123');
  });
});
