import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';
import type { ApiError } from '../src/utils/apiError.js';

// fake database, so these tests never touch a real one
const prismaMock = {
  item: { findUnique: jest.fn<(args: unknown) => Promise<unknown>>() },
  claim: { create: jest.fn<(args: unknown) => Promise<unknown>>() },
};

jest.unstable_mockModule('../src/config/db.prisma.js', () => ({
  prisma: prismaMock,
}));

const { createClaim } = await import('../src/controllers/claim.controller.js');
const { Prisma } = await import('../src/generated/prisma/client.js');

const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const CLAIMER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const MESSAGE_MAX = 500;
const TOO_LONG_MESSAGE = 'a'.repeat(MESSAGE_MAX + 1);
const CLAIM_ID = '9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d';

const itemWith = (status: string) => ({
  id: ITEM_ID,
  ownerId: OWNER_ID,
  status,
});

const setup = (userId: string | undefined, id = ITEM_ID, body = {}) => {
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

const statusOf = (error: unknown) => (error as ApiError).status;

describe('createClaim', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('creates a pending claim and returns 201', async () => {
    prismaMock.item.findUnique.mockResolvedValue(itemWith('available'));
    prismaMock.claim.create.mockResolvedValue({
      id: CLAIM_ID,
      itemId: ITEM_ID,
      status: 'pending',
    });
    const { req, res, status, json } = setup(CLAIMER_ID, ITEM_ID, {
      message: '  Is it still free?  ',
    });

    await createClaim(req as never, res as never);

    expect(prismaMock.claim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          itemId: ITEM_ID,
          claimerId: CLAIMER_ID,
          message: 'Is it still free?',
        },
      }),
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: CLAIM_ID, itemId: ITEM_ID, status: 'pending' },
    });
  });

  test('works without a message and saves null', async () => {
    prismaMock.item.findUnique.mockResolvedValue(itemWith('available'));
    prismaMock.claim.create.mockResolvedValue({ id: CLAIM_ID });
    const { req, res, status } = setup(CLAIMER_ID);

    await createClaim(req as never, res as never);

    expect(prismaMock.claim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ message: null }),
      }),
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.CREATED);
  });

  test('lets a user join the waiting list of a reserved item', async () => {
    prismaMock.item.findUnique.mockResolvedValue(itemWith('reserved'));
    prismaMock.claim.create.mockResolvedValue({ id: CLAIM_ID });
    const { req, res, status } = setup(CLAIMER_ID);

    await createClaim(req as never, res as never);

    expect(status).toHaveBeenCalledWith(StatusCodes.CREATED);
  });

  test('returns 401 when there is no signed-in user', async () => {
    const { req, res } = setup(undefined);
    const error = await errorFrom(() =>
      createClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 400 for an id that is not a UUID', async () => {
    const { req, res } = setup(CLAIMER_ID, '123');
    const error = await errorFrom(() =>
      createClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.BAD_REQUEST);
    expect(prismaMock.item.findUnique).not.toHaveBeenCalled();
  });

  test('returns 400 for a message longer than 500 characters', async () => {
    const { req, res } = setup(CLAIMER_ID, ITEM_ID, {
      message: TOO_LONG_MESSAGE,
    });
    const error = await errorFrom(() =>
      createClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.BAD_REQUEST);
    expect(prismaMock.claim.create).not.toHaveBeenCalled();
  });

  test('returns 404 when the item does not exist', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);
    const { req, res } = setup(CLAIMER_ID);
    const error = await errorFrom(() =>
      createClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.NOT_FOUND);
    expect(prismaMock.claim.create).not.toHaveBeenCalled();
  });

  test('returns 403 when the user owns the item', async () => {
    prismaMock.item.findUnique.mockResolvedValue(itemWith('available'));
    const { req, res } = setup(OWNER_ID);
    const error = await errorFrom(() =>
      createClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.FORBIDDEN);
    expect(prismaMock.claim.create).not.toHaveBeenCalled();
  });

  test.each(['picked_up', 'withdrawn'])(
    'returns 409 when the item is %s',
    async (itemStatus) => {
      prismaMock.item.findUnique.mockResolvedValue(itemWith(itemStatus));
      const { req, res } = setup(CLAIMER_ID);
      const error = await errorFrom(() =>
        createClaim(req as never, res as never),
      );

      expect(statusOf(error)).toBe(StatusCodes.CONFLICT);
      expect(prismaMock.claim.create).not.toHaveBeenCalled();
    },
  );

  test('returns 409, not 500, when the database finds a duplicate active claim', async () => {
    prismaMock.item.findUnique.mockResolvedValue(itemWith('available'));
    prismaMock.claim.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    const { req, res } = setup(CLAIMER_ID);
    const error = await errorFrom(() =>
      createClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.CONFLICT);
  });

  test('passes any other database error on', async () => {
    const failure = new Error('connection lost');
    prismaMock.item.findUnique.mockResolvedValue(itemWith('available'));
    prismaMock.claim.create.mockRejectedValue(failure);
    const { req, res } = setup(CLAIMER_ID);
    const error = await errorFrom(() =>
      createClaim(req as never, res as never),
    );

    expect(error).toBe(failure);
  });
});
