import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';
import type { ApiError } from '../src/utils/apiError.js';

const txMock = {
  claim: {
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    updateMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
  },
  item: {
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    updateMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
  },
};

const prismaMock = {
  $transaction:
    jest.fn<
      (callback: (tx: typeof txMock) => Promise<unknown>) => Promise<unknown>
    >(),
};

jest.unstable_mockModule('../src/config/db.prisma.js', () => ({
  prisma: prismaMock,
}));

const { cancelClaim, markNoShow, markItemPickedUp } =
  await import('../src/controllers/claimStatus.controller.js');

const CLAIM_ID = '9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d';
const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const CLAIMER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const ONE_ROW = { count: 1 };
const NO_ROWS = { count: 0 };

const setup = (userId: string | null, id: string) => {
  const req = {
    user: userId ? { id: userId, csrfToken: 'token' } : undefined,
    params: { id },
  };
  const json = jest.fn();
  const status = jest.fn<(code: number) => { json: typeof json }>(() => ({
    json,
  }));

  return { req, res: { status, json }, status, json };
};

const errorFrom = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    return error;
  }
  return undefined;
};

const statusOf = (error: unknown) => (error as ApiError).status;

beforeEach(() => {
  jest.resetAllMocks();
  prismaMock.$transaction.mockImplementation(async (callback) =>
    callback(txMock),
  );
});

describe('cancelClaim', () => {
  const claimWith = (status: string, claimerId = CLAIMER_ID) => ({
    id: CLAIM_ID,
    itemId: ITEM_ID,
    claimerId,
    status,
  });

  const run = (userId: string | null = CLAIMER_ID, id = CLAIM_ID) => {
    const ctx = setup(userId, id);
    return {
      ...ctx,
      call: () => cancelClaim(ctx.req as never, ctx.res as never),
    };
  };

  test('returns 401 when nobody is signed in', async () => {
    const { call } = run(null);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 400 for an invalid claim id', async () => {
    const { call } = run(CLAIMER_ID, 'abc');

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.BAD_REQUEST);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  test('returns 404 when the claim does not exist', async () => {
    txMock.claim.findUnique.mockResolvedValue(null);
    const { call } = run();

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 403 when the user is not the claimer', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
    const { call } = run(OWNER_ID);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.FORBIDDEN);
    expect(txMock.claim.updateMany).not.toHaveBeenCalled();
  });

  test.each(['declined', 'cancelled', 'no_show', 'picked_up'])(
    'returns 409 when the claim is %s',
    async (status) => {
      txMock.claim.findUnique.mockResolvedValue(claimWith(status));
      const { call } = run();

      expect(statusOf(await errorFrom(call))).toBe(StatusCodes.CONFLICT);
      expect(txMock.claim.updateMany).not.toHaveBeenCalled();
    },
  );

  test('cancels a pending claim and leaves the item alone', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
    txMock.claim.updateMany.mockResolvedValue(ONE_ROW);
    const { call, status, json } = run();

    await call();

    expect(txMock.claim.updateMany).toHaveBeenCalledWith({
      where: { id: CLAIM_ID, status: 'pending' },
      data: { status: 'cancelled' },
    });
    expect(txMock.item.updateMany).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: CLAIM_ID, status: 'cancelled' },
    });
  });

  test('cancelling an approved claim makes the item available again', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
    txMock.claim.updateMany.mockResolvedValue(ONE_ROW);
    txMock.item.updateMany.mockResolvedValue(ONE_ROW);
    const { call } = run();

    await call();

    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: ITEM_ID, status: 'reserved' },
      data: { status: 'available', reservedAt: null },
    });
  });

  test('returns 409 when the claim changed while cancelling', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
    txMock.claim.updateMany.mockResolvedValue(NO_ROWS);
    const { call } = run();

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.CONFLICT);
  });
});

describe('markNoShow', () => {
  const claimWith = (status: string) => ({
    id: CLAIM_ID,
    itemId: ITEM_ID,
    status,
    item: { ownerId: OWNER_ID },
  });

  const run = (userId: string | null = OWNER_ID, id = CLAIM_ID) => {
    const ctx = setup(userId, id);
    return {
      ...ctx,
      call: () => markNoShow(ctx.req as never, ctx.res as never),
    };
  };

  test('returns 401 when nobody is signed in', async () => {
    const { call } = run(null);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 400 for an invalid claim id', async () => {
    const { call } = run(OWNER_ID, 'abc');

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.BAD_REQUEST);
  });

  test('returns 404 when the claim does not exist', async () => {
    txMock.claim.findUnique.mockResolvedValue(null);
    const { call } = run();

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 403 when the user is not the item owner', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
    const { call } = run(CLAIMER_ID);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.FORBIDDEN);
    expect(txMock.claim.updateMany).not.toHaveBeenCalled();
  });

  test.each(['pending', 'declined', 'cancelled', 'no_show', 'picked_up'])(
    'returns 409 when the claim is %s',
    async (status) => {
      txMock.claim.findUnique.mockResolvedValue(claimWith(status));
      const { call } = run();

      expect(statusOf(await errorFrom(call))).toBe(StatusCodes.CONFLICT);
    },
  );

  test('marks the claim no_show and frees the item', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
    txMock.claim.updateMany.mockResolvedValue(ONE_ROW);
    txMock.item.updateMany.mockResolvedValue(ONE_ROW);
    const { call, status, json } = run();

    await call();

    expect(txMock.claim.updateMany).toHaveBeenCalledWith({
      where: { id: CLAIM_ID, status: 'approved' },
      data: { status: 'no_show' },
    });
    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: ITEM_ID, status: 'reserved' },
      data: { status: 'available', reservedAt: null },
    });
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: CLAIM_ID, status: 'no_show' },
    });
  });

  test('returns 409 when the claim changed at the same time', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
    txMock.claim.updateMany.mockResolvedValue(NO_ROWS);
    const { call } = run();

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.CONFLICT);
    expect(txMock.item.updateMany).not.toHaveBeenCalled();
  });

  test('returns 409 when the item is not reserved any more', async () => {
    txMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
    txMock.claim.updateMany.mockResolvedValue(ONE_ROW);
    txMock.item.updateMany.mockResolvedValue(NO_ROWS);
    const { call } = run();

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.CONFLICT);
  });
});

describe('markItemPickedUp', () => {
  const itemWith = (status: string) => ({
    id: ITEM_ID,
    ownerId: OWNER_ID,
    status,
  });

  const run = (userId: string | null = OWNER_ID, id = ITEM_ID) => {
    const ctx = setup(userId, id);
    return {
      ...ctx,
      call: () => markItemPickedUp(ctx.req as never, ctx.res as never),
    };
  };

  test('returns 401 when nobody is signed in', async () => {
    const { call } = run(null);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 400 for an invalid item id', async () => {
    const { call } = run(OWNER_ID, 'abc');

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.BAD_REQUEST);
  });

  test('returns 404 when the item does not exist', async () => {
    txMock.item.findUnique.mockResolvedValue(null);
    const { call } = run();

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 403 when the user is not the owner', async () => {
    txMock.item.findUnique.mockResolvedValue(itemWith('reserved'));
    const { call } = run(CLAIMER_ID);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.FORBIDDEN);
    expect(txMock.item.updateMany).not.toHaveBeenCalled();
  });

  test.each(['available', 'picked_up', 'withdrawn'])(
    'returns 409 when the item is %s',
    async (status) => {
      txMock.item.findUnique.mockResolvedValue(itemWith(status));
      const { call } = run();

      expect(statusOf(await errorFrom(call))).toBe(StatusCodes.CONFLICT);
    },
  );

  test('returns 409 when the item changed at the same time', async () => {
    txMock.item.findUnique.mockResolvedValue(itemWith('reserved'));
    txMock.item.updateMany.mockResolvedValue(NO_ROWS);
    const { call } = run();

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.CONFLICT);
    expect(txMock.claim.updateMany).not.toHaveBeenCalled();
  });

  test('closes the item, the approved claim and the waiting list', async () => {
    txMock.item.findUnique.mockResolvedValue(itemWith('reserved'));
    txMock.item.updateMany.mockResolvedValue(ONE_ROW);
    txMock.claim.updateMany.mockResolvedValue(ONE_ROW);
    const { call, status, json } = run();

    await call();

    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: ITEM_ID, status: 'reserved' },
      data: { status: 'picked_up', pickedUpAt: expect.any(Date) },
    });
    expect(txMock.claim.updateMany).toHaveBeenCalledWith({
      where: { itemId: ITEM_ID, status: 'approved' },
      data: { status: 'picked_up', pickedUpAt: expect.any(Date) },
    });
    expect(txMock.claim.updateMany).toHaveBeenCalledWith({
      where: { itemId: ITEM_ID, status: 'pending' },
      data: { status: 'declined', decidedAt: expect.any(Date) },
    });
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: ITEM_ID, status: 'picked_up' },
    });
  });
});
