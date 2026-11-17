import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';
import type { ApiError } from '../src/utils/apiError.js';

const txMock = {
  claim: {
    findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
    findFirst: jest.fn<(args: unknown) => Promise<unknown>>(),
    updateMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
  },
  item: {
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

const { decideClaim } = await import('../src/controllers/claim.controller.js');
const { Prisma } = await import('../src/generated/prisma/client.js');

const CLAIM_ID = '9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d';
const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const pendingClaim = (itemStatus = 'available') => ({
  id: CLAIM_ID,
  itemId: ITEM_ID,
  status: 'pending',
  item: {
    ownerId: OWNER_ID,
    status: itemStatus,
  },
});

const setup = (
  userId: string | undefined = OWNER_ID,
  id = CLAIM_ID,
  body: unknown = { status: 'approved' },
) => {
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

describe('decideClaim', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(txMock),
    );

    txMock.claim.findUnique.mockResolvedValue(pendingClaim());
    txMock.claim.findFirst.mockResolvedValue(null);
    txMock.claim.updateMany.mockResolvedValue({ count: 1 });
    txMock.item.updateMany.mockResolvedValue({ count: 1 });
  });

  test('approves a claim and reserves the item', async () => {
    const { req, res, status, json } = setup();

    await decideClaim(req as never, res as never);

    expect(txMock.item.updateMany).toHaveBeenCalledWith({
      where: { id: ITEM_ID, status: 'available' },
      data: {
        status: 'reserved',
        reservedAt: expect.any(Date),
      },
    });

    expect(txMock.claim.updateMany).toHaveBeenCalledWith({
      where: { id: CLAIM_ID, status: 'pending' },
      data: {
        status: 'approved',
        decidedAt: expect.any(Date),
      },
    });

    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: CLAIM_ID, status: 'approved' },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  test('declines a claim without updating the item', async () => {
    const { req, res, json } = setup(OWNER_ID, CLAIM_ID, {
      status: 'declined',
    });

    await decideClaim(req as never, res as never);

    expect(txMock.claim.updateMany).toHaveBeenCalledWith({
      where: { id: CLAIM_ID, status: 'pending' },
      data: {
        status: 'declined',
        decidedAt: expect.any(Date),
      },
    });

    expect(txMock.item.updateMany).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: { id: CLAIM_ID, status: 'declined' },
    });
  });

  test('returns 401 without authentication', async () => {
    const { req, res } = setup();
    req.user = undefined;

    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.UNAUTHORIZED);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  test('returns 400 for an invalid claim ID', async () => {
    const { req, res } = setup(OWNER_ID, 'invalid-id');
    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.BAD_REQUEST);
  });

  test.each(['pending', 'cancelled', 'unknown'])(
    'returns 400 for invalid request status %s',
    async (invalidStatus) => {
      const { req, res } = setup(OWNER_ID, CLAIM_ID, {
        status: invalidStatus,
      });

      const error = await errorFrom(() =>
        decideClaim(req as never, res as never),
      );

      expect(statusOf(error)).toBe(StatusCodes.BAD_REQUEST);
    },
  );

  test('returns 403 if user is not the item owner', async () => {
    const { req, res } = setup(OTHER_USER_ID);
    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.FORBIDDEN);
    expect(txMock.claim.updateMany).not.toHaveBeenCalled();
  });

  test('returns 404 when the claim does not exist', async () => {
    txMock.claim.findUnique.mockResolvedValue(null);

    const { req, res } = setup();
    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 409 when the claim is not pending', async () => {
    txMock.claim.findUnique.mockResolvedValue({
      ...pendingClaim(),
      status: 'approved',
    });

    const { req, res } = setup();
    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.CONFLICT);
  });

  test('returns 409 when another claim is approved', async () => {
    txMock.claim.findFirst.mockResolvedValue({ id: OTHER_USER_ID });

    const { req, res } = setup();
    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.CONFLICT);
    expect(txMock.claim.updateMany).not.toHaveBeenCalled();
  });

  test('returns 409 if the item is already reserved', async () => {
    txMock.claim.findUnique.mockResolvedValue(pendingClaim('reserved'));

    const { req, res } = setup();
    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.CONFLICT);
  });

  test('returns 409 when a conditional update loses a race', async () => {
    txMock.item.updateMany.mockResolvedValue({ count: 0 });

    const { req, res } = setup();
    const error = await errorFrom(() =>
      decideClaim(req as never, res as never),
    );

    expect(statusOf(error)).toBe(StatusCodes.CONFLICT);
  });

  test.each(['P2002', 'P2034'])(
    'returns 409 for Prisma %s conflicts',
    async (code) => {
      prismaMock.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Database approval conflict', {
          code,
          clientVersion: 'test',
        }),
      );

      const { req, res } = setup();
      const error = await errorFrom(() =>
        decideClaim(req as never, res as never),
      );

      expect(statusOf(error)).toBe(StatusCodes.CONFLICT);
    },
  );

  test('does not update other pending claims', async () => {
    const { req, res } = setup();

    await decideClaim(req as never, res as never);

    expect(txMock.claim.updateMany).toHaveBeenCalledTimes(1);
    expect(txMock.claim.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CLAIM_ID, status: 'pending' },
      }),
    );
  });
});
