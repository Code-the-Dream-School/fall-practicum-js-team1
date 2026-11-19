import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import process from 'node:process';
import {
  describe,
  test,
  expect,
  jest,
  beforeAll,
  afterAll,
} from '@jest/globals';
import jwt from 'jsonwebtoken';
import { io as connect, type Socket } from 'socket.io-client';

process.env.JWT_SECRET = 'test-secret';

const OWNER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const CLAIMER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const STRANGER_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CLAIM_ID = '9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d';
const OTHER_CLAIM_ID = '11111111-0000-4000-8000-000000000001';

const prismaMock = {
  claim: {
    findUnique: jest.fn(async (args: unknown) => {
      const id = (args as { where: { id: string } }).where.id;
      return id === CLAIM_ID
        ? {
            id,
            claimerId: CLAIMER_ID,
            status: 'pending',
            item: { ownerId: OWNER_ID },
          }
        : null;
    }),
  },
};

jest.unstable_mockModule('../src/config/db.prisma.js', () => ({
  prisma: prismaMock,
}));

const { initSocket, emitMessagesChanged } = await import('../src/socket.js');

const cookieFor = (userId: string) =>
  `jwt=${jwt.sign({ id: userId, csrfToken: 'c' }, 'test-secret')}`;

let httpServer: HttpServer;
let url: string;
const opened: Socket[] = [];

const open = (cookie?: string) => {
  const socket = connect(url, {
    transports: ['websocket'],
    forceNew: true,
    ...(cookie ? { extraHeaders: { cookie } } : {}),
  });
  opened.push(socket);
  return socket;
};

const connected = (socket: Socket) =>
  new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', (error) => reject(error));
  });

const join = (socket: Socket, claimId: unknown) =>
  new Promise<{ ok: boolean }>((resolve) => {
    socket.emit('join-claim', claimId, resolve);
  });

const waitFor = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
  httpServer = createServer();
  initSocket(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  opened.forEach((socket) => socket.disconnect());
  await new Promise((resolve) => httpServer.close(resolve));
});

describe('socket server', () => {
  test('refuses a connection without a login cookie', async () => {
    await expect(connected(open())).rejects.toThrow('Please sign in');
  });

  test('refuses a connection with a bad token', async () => {
    await expect(connected(open('jwt=not-a-token'))).rejects.toThrow(
      'Please sign in',
    );
  });

  test('lets the claimer and the owner join the claim room', async () => {
    const claimer = open(cookieFor(CLAIMER_ID));
    const owner = open(cookieFor(OWNER_ID));
    await Promise.all([connected(claimer), connected(owner)]);

    expect(await join(claimer, CLAIM_ID)).toEqual({ ok: true });
    expect(await join(owner, CLAIM_ID)).toEqual({ ok: true });
  });

  test('refuses a user who is not part of the claim', async () => {
    const stranger = open(cookieFor(STRANGER_ID));
    await connected(stranger);

    expect(await join(stranger, CLAIM_ID)).toEqual({ ok: false });
  });

  test('refuses a claim that does not exist and an invalid id', async () => {
    const claimer = open(cookieFor(CLAIMER_ID));
    await connected(claimer);

    expect(await join(claimer, OTHER_CLAIM_ID)).toEqual({ ok: false });
    expect(await join(claimer, 'not-a-uuid')).toEqual({ ok: false });
    expect(await join(claimer, undefined)).toEqual({ ok: false });
  });

  test('sends messages-changed to the people in the room only', async () => {
    const claimer = open(cookieFor(CLAIMER_ID));
    const stranger = open(cookieFor(STRANGER_ID));
    await Promise.all([connected(claimer), connected(stranger)]);
    await join(claimer, CLAIM_ID);
    await join(stranger, CLAIM_ID);

    const claimerHeard = jest.fn();
    const strangerHeard = jest.fn();
    claimer.on('messages-changed', claimerHeard);
    stranger.on('messages-changed', strangerHeard);

    emitMessagesChanged(CLAIM_ID, []);
    await waitFor(150);

    expect(claimerHeard).toHaveBeenCalledTimes(1);
    expect(strangerHeard).not.toHaveBeenCalled();
  });

  test('does not send an update about another claim', async () => {
    const claimer = open(cookieFor(CLAIMER_ID));
    await connected(claimer);
    await join(claimer, CLAIM_ID);
    const heard = jest.fn();
    claimer.on('messages-changed', heard);

    emitMessagesChanged(OTHER_CLAIM_ID, []);
    await waitFor(150);

    expect(heard).not.toHaveBeenCalled();
  });

  test('tells a person on any page, once, even when they joined the room too', async () => {
    const claimer = open(cookieFor(CLAIMER_ID));
    const stranger = open(cookieFor(STRANGER_ID));
    await Promise.all([connected(claimer), connected(stranger)]);
    await join(claimer, CLAIM_ID);

    const claimerHeard = jest.fn();
    const strangerHeard = jest.fn();
    claimer.on('messages-changed', claimerHeard);
    stranger.on('messages-changed', strangerHeard);

    emitMessagesChanged(CLAIM_ID, [CLAIMER_ID, OWNER_ID]);
    await waitFor(150);

    expect(claimerHeard).toHaveBeenCalledTimes(1);
    expect(claimerHeard).toHaveBeenCalledWith(CLAIM_ID);
    expect(strangerHeard).not.toHaveBeenCalled();
  });
});
