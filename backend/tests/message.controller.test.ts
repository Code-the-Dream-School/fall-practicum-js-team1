import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// a throwaway key just for these tests
process.env.MESSAGE_ENCRYPTION_KEY = 'ab'.repeat(32);

// fake database, so these tests never touch a real one
const prismaMock = {
  claim: { findUnique: jest.fn<(args: unknown) => Promise<unknown>>() },
  claimMessage: {
    create: jest.fn<(args: unknown) => Promise<unknown>>(),
    findMany: jest.fn<(args: unknown) => Promise<unknown>>(),
    updateMany: jest.fn<(args: unknown) => Promise<unknown>>(),
  },
};

jest.unstable_mockModule('../src/config/db.prisma.js', () => ({
  prisma: prismaMock,
}));

const { sendMessage, getMessages, markMessagesRead } =
  await import('../src/controllers/message.controller.js');
const { ApiError } = await import('../src/utils/apiError.js');
const { encryptMessage, decryptMessage } =
  await import('../src/utils/messageCrypto.js');

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

const setup = (userId: string | undefined, id = CLAIM_ID, body = {}) => {
  const req = {
    user: userId ? { id: userId, csrfToken: 'token' } : undefined,
    params: { id },
    body,
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

describe('message controller', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('sendMessage', () => {
    test('creates the message for the claimer and returns 201', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
      prismaMock.claimMessage.create.mockImplementation(async (args) => ({
        id: 'm1',
        ...(args as { data: object }).data,
        readAt: null,
      }));
      const { req, res, status, json } = setup(CLAIMER_ID, CLAIM_ID, {
        body: '  Hi  ',
      });

      await sendMessage(req as never, res as never);

      const saved = prismaMock.claimMessage.create.mock.calls[0]?.[0] as {
        data: { claimId: string; senderId: string; body: string };
      };
      expect(saved.data.claimId).toBe(CLAIM_ID);
      expect(saved.data.senderId).toBe(CLAIMER_ID);
      expect(saved.data.body).not.toContain('Hi');
      expect(decryptMessage(saved.data.body)).toBe('Hi');

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ id: 'm1', body: 'Hi', readAt: null }),
      });
    });

    test('lets the item owner send on an approved claim', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
      prismaMock.claimMessage.create.mockResolvedValue({
        id: 'm2',
        body: encryptMessage('Hi'),
      });
      const { req, res, status } = setup(OWNER_ID, CLAIM_ID, { body: 'Hi' });

      await sendMessage(req as never, res as never);

      expect(status).toHaveBeenCalledWith(201);
    });

    test('rejects an id that is not a UUID with 400', async () => {
      const { req, res } = setup(CLAIMER_ID, '123', { body: 'Hi' });
      const error = await errorFrom(() =>
        sendMessage(req as never, res as never),
      );

      expect(error).toBeInstanceOf(ApiError);
      expect((error as InstanceType<typeof ApiError>).status).toBe(400);
    });

    test('rejects an empty body with 400', async () => {
      const { req, res } = setup(CLAIMER_ID, CLAIM_ID, { body: '   ' });
      const error = await errorFrom(() =>
        sendMessage(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(400);
      expect(prismaMock.claimMessage.create).not.toHaveBeenCalled();
    });

    test('returns 404 when the claim does not exist', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(null);
      const { req, res } = setup(CLAIMER_ID, CLAIM_ID, { body: 'Hi' });
      const error = await errorFrom(() =>
        sendMessage(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(404);
    });

    test('returns 403 for a user who is not part of the claim', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
      const { req, res } = setup(STRANGER_ID, CLAIM_ID, { body: 'Hi' });
      const error = await errorFrom(() =>
        sendMessage(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(403);
      expect(prismaMock.claimMessage.create).not.toHaveBeenCalled();
    });

    test.each(['declined', 'cancelled', 'no_show', 'picked_up'])(
      'returns 409 when the claim is %s',
      async (status) => {
        prismaMock.claim.findUnique.mockResolvedValue(claimWith(status));
        const { req, res } = setup(CLAIMER_ID, CLAIM_ID, { body: 'Hi' });
        const error = await errorFrom(() =>
          sendMessage(req as never, res as never),
        );

        expect((error as InstanceType<typeof ApiError>).status).toBe(409);
        expect(prismaMock.claimMessage.create).not.toHaveBeenCalled();
      },
    );

    test('returns 401 when there is no signed-in user', async () => {
      const { req, res } = setup(undefined, CLAIM_ID, { body: 'Hi' });
      const error = await errorFrom(() =>
        sendMessage(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(401);
    });
  });

  describe('getMessages', () => {
    test('returns the thread oldest first, without deleted messages', async () => {
      const thread = [
        { id: 'm1', body: encryptMessage('First') },
        { id: 'm2', body: encryptMessage('Second') },
      ];
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
      prismaMock.claimMessage.findMany.mockResolvedValue(thread);
      const { req, res, status, json } = setup(OWNER_ID);

      await getMessages(req as never, res as never);

      expect(prismaMock.claimMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { claimId: CLAIM_ID, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: [
          { id: 'm1', body: 'First' },
          { id: 'm2', body: 'Second' },
        ],
      });
    });

    test('still works on a closed claim', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('declined'));
      prismaMock.claimMessage.findMany.mockResolvedValue([]);
      const { req, res, status } = setup(CLAIMER_ID);

      await getMessages(req as never, res as never);

      expect(status).toHaveBeenCalledWith(200);
    });

    test('returns 403 for a user who is not part of the claim', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
      const { req, res } = setup(STRANGER_ID);
      const error = await errorFrom(() =>
        getMessages(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(403);
      expect(prismaMock.claimMessage.findMany).not.toHaveBeenCalled();
    });

    test('returns 404 when the claim does not exist', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(null);
      const { req, res } = setup(CLAIMER_ID);
      const error = await errorFrom(() =>
        getMessages(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(404);
    });
  });

  describe('markMessagesRead', () => {
    test("marks only the other person's unread messages", async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('approved'));
      prismaMock.claimMessage.updateMany.mockResolvedValue({ count: 2 });
      const { req, res, status, json } = setup(CLAIMER_ID);

      await markMessagesRead(req as never, res as never);

      expect(prismaMock.claimMessage.updateMany).toHaveBeenCalledWith({
        where: {
          claimId: CLAIM_ID,
          senderId: { not: CLAIMER_ID },
          readAt: null,
          deletedAt: null,
        },
        data: { readAt: expect.any(Date) },
      });
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        success: true,
        data: { updatedCount: 2 },
      });
    });

    test('returns updatedCount 0 when nothing is unread', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
      prismaMock.claimMessage.updateMany.mockResolvedValue({ count: 0 });
      const { req, res, json } = setup(OWNER_ID);

      await markMessagesRead(req as never, res as never);

      expect(json).toHaveBeenCalledWith({
        success: true,
        data: { updatedCount: 0 },
      });
    });

    test('returns 403 for a user who is not part of the claim', async () => {
      prismaMock.claim.findUnique.mockResolvedValue(claimWith('pending'));
      const { req, res } = setup(STRANGER_ID);
      const error = await errorFrom(() =>
        markMessagesRead(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(403);
      expect(prismaMock.claimMessage.updateMany).not.toHaveBeenCalled();
    });

    test('returns 400 for an id that is not a UUID', async () => {
      const { req, res } = setup(CLAIMER_ID, 'abc');
      const error = await errorFrom(() =>
        markMessagesRead(req as never, res as never),
      );

      expect((error as InstanceType<typeof ApiError>).status).toBe(400);
    });
  });
});
