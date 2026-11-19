import { describe, test, expect, jest, beforeEach } from '@jest/globals';

process.env.MESSAGE_ENCRYPTION_KEY = 'ab'.repeat(32);

const prismaMock = {
  claim: { findUnique: jest.fn<(args: unknown) => Promise<unknown>>() },
  claimMessage: {
    create: jest.fn<(args: unknown) => Promise<unknown>>(),
    updateMany: jest.fn<(args: unknown) => Promise<unknown>>(),
  },
};
const emitMessagesChanged =
  jest.fn<(claimId: string, participantIds: string[]) => void>();

jest.unstable_mockModule('../src/config/db.prisma.js', () => ({
  prisma: prismaMock,
}));
jest.unstable_mockModule('../src/socket.js', () => ({ emitMessagesChanged }));

const { sendMessage, markMessagesRead } =
  await import('../src/controllers/message.controller.js');

const CLAIM_ID = '9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d';
const OWNER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const CLAIMER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const STRANGER_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

const claimWith = (status: string) => ({
  id: CLAIM_ID,
  claimerId: CLAIMER_ID,
  status,
  item: { ownerId: OWNER_ID },
});

const setup = (userId: string, body = {}) => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  return {
    req: {
      user: { id: userId, csrfToken: 'token' },
      params: { id: CLAIM_ID },
      body,
    },
    res: { status, json },
  };
};

const run = async (action: () => Promise<unknown>) => {
  try {
    await action();
  } catch {
    return;
  }
};

describe('live updates from the message controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('sending a message tells the claim room and both people', async () => {
    prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
    prismaMock.claimMessage.create.mockImplementation(async (args) => ({
      id: 'm1',
      ...(args as { data: object }).data,
      readAt: null,
    }));
    const { req, res } = setup(CLAIMER_ID, { body: 'Hi' });

    await sendMessage(req as never, res as never);

    expect(emitMessagesChanged).toHaveBeenCalledTimes(1);
    expect(emitMessagesChanged).toHaveBeenCalledWith(CLAIM_ID, [
      CLAIMER_ID,
      OWNER_ID,
    ]);
  });

  test('a message that is not saved does not tell anyone', async () => {
    prismaMock.claim.findUnique.mockResolvedValue(claimWith('declined'));
    const { req, res } = setup(CLAIMER_ID, { body: 'Hi' });

    await run(() => sendMessage(req as never, res as never));

    expect(emitMessagesChanged).not.toHaveBeenCalled();
  });

  test('a stranger cannot trigger an update', async () => {
    prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
    const { req, res } = setup(STRANGER_ID, { body: 'Hi' });

    await run(() => sendMessage(req as never, res as never));

    expect(emitMessagesChanged).not.toHaveBeenCalled();
  });

  test('marking messages as read tells the room, so the receipt updates', async () => {
    prismaMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
    prismaMock.claimMessage.updateMany.mockResolvedValue({ count: 2 });
    const { req, res } = setup(OWNER_ID);

    await markMessagesRead(req as never, res as never);

    expect(emitMessagesChanged).toHaveBeenCalledWith(CLAIM_ID, [
      CLAIMER_ID,
      OWNER_ID,
    ]);
  });

  test('nothing new to mark as read does not tell anyone', async () => {
    prismaMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
    prismaMock.claimMessage.updateMany.mockResolvedValue({ count: 0 });
    const { req, res } = setup(OWNER_ID);

    await markMessagesRead(req as never, res as never);

    expect(emitMessagesChanged).not.toHaveBeenCalled();
  });
});
