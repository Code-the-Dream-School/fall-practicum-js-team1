import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';
import type { ApiError } from '../src/utils/apiError.js';

const prismaMock = {
  item: { findUnique: jest.fn<(args: unknown) => Promise<unknown>>() },
  claim: { findMany: jest.fn<(args: unknown) => Promise<unknown>>() },
  itemPickupDetail: {
    findMany: jest.fn<(args: unknown) => Promise<unknown>>(),
  },
};

jest.unstable_mockModule('../src/config/db.prisma.js', () => ({
  prisma: prismaMock,
}));

const { getItemClaims, getMyClaims } =
  await import('../src/controllers/claimList.controller.js');

const ITEM_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const CLAIMER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const OTHER_ITEM_ID = '1b4e28ba-2fa1-41d2-883f-0016d3cca427';

const setup = (
  userId: string | undefined,
  params: Record<string, string> = {},
  query: Record<string, unknown> = {},
) => {
  const req = {
    user: userId ? { id: userId, csrfToken: 'token' } : undefined,
    params,
    query,
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

describe('getItemClaims', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const run = (
    userId: string | undefined,
    id = ITEM_ID,
    query: Record<string, unknown> = {},
  ) => {
    const ctx = setup(userId, { id }, query);
    return {
      ...ctx,
      call: () => getItemClaims(ctx.req as never, ctx.res as never),
    };
  };

  test('returns 401 when nobody is signed in', async () => {
    const { call } = run(undefined);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 400 for an invalid item id', async () => {
    const { call } = run(OWNER_ID, 'abc');

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.BAD_REQUEST);
    expect(prismaMock.item.findUnique).not.toHaveBeenCalled();
  });

  test('returns 400 for an invalid status filter', async () => {
    const { call } = run(OWNER_ID, ITEM_ID, { status: 'maybe' });

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.BAD_REQUEST);
  });

  test('returns 404 when the item does not exist', async () => {
    prismaMock.item.findUnique.mockResolvedValue(null);
    const { call } = run(OWNER_ID);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 403 when the user is not the owner', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ ownerId: OWNER_ID });
    const { call } = run(CLAIMER_ID);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.FORBIDDEN);
    expect(prismaMock.claim.findMany).not.toHaveBeenCalled();
  });

  test('returns the claims newest first for the owner', async () => {
    const claims = [{ id: 'claim-1', status: 'pending' }];
    prismaMock.item.findUnique.mockResolvedValue({ ownerId: OWNER_ID });
    prismaMock.claim.findMany.mockResolvedValue(claims);
    const { call, status, json } = run(OWNER_ID);

    await call();

    expect(prismaMock.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { itemId: ITEM_ID },
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(json).toHaveBeenCalledWith({ success: true, data: claims });
  });

  test('applies the status filter', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ ownerId: OWNER_ID });
    prismaMock.claim.findMany.mockResolvedValue([]);
    const { call } = run(OWNER_ID, ITEM_ID, { status: 'pending' });

    await call();

    expect(prismaMock.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { itemId: ITEM_ID, status: 'pending' },
      }),
    );
  });

  test('never asks the database for pickup details', async () => {
    prismaMock.item.findUnique.mockResolvedValue({ ownerId: OWNER_ID });
    prismaMock.claim.findMany.mockResolvedValue([]);
    const { call } = run(OWNER_ID);

    await call();

    expect(prismaMock.itemPickupDetail.findMany).not.toHaveBeenCalled();
  });
});

describe('getMyClaims', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const itemFields = (id: string, status: string) => ({
    id,
    title: 'Baby Stroller',
    status,
    owner: { id: OWNER_ID, name: 'Jane Smith' },
    photos: [{ url: 'https://example.com/a.jpg', altText: 'Grey stroller' }],
  });

  const pickupRow = {
    itemId: ITEM_ID,
    instructions: 'Ring the bell twice',
    availability: 'Weekdays after 5pm',
    address: {
      line1: '123 Main Street',
      line2: null,
      city: 'San Rafael',
      state: 'CA',
      postalCode: '94901',
    },
  };

  const run = (
    userId: string | undefined,
    query: Record<string, unknown> = {},
  ) => {
    const ctx = setup(userId, {}, query);
    return {
      ...ctx,
      call: () => getMyClaims(ctx.req as never, ctx.res as never),
    };
  };

  test('returns 401 when nobody is signed in', async () => {
    const { call } = run(undefined);

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.UNAUTHORIZED);
  });

  test('returns 400 for an invalid status filter', async () => {
    const { call } = run(CLAIMER_ID, { status: 'maybe' });

    expect(statusOf(await errorFrom(call))).toBe(StatusCodes.BAD_REQUEST);
    expect(prismaMock.claim.findMany).not.toHaveBeenCalled();
  });

  test('only asks for the signed-in user claims, newest first', async () => {
    prismaMock.claim.findMany.mockResolvedValue([]);
    const { call, json } = run(CLAIMER_ID, { status: 'pending' });

    await call();

    expect(prismaMock.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { claimerId: CLAIMER_ID, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  test('includes the pickup details only for an approved claim', async () => {
    prismaMock.claim.findMany.mockResolvedValue([
      {
        id: 'claim-approved',
        status: 'approved',
        createdAt: 'later',
        item: itemFields(ITEM_ID, 'reserved'),
      },
      {
        id: 'claim-pending',
        status: 'pending',
        createdAt: 'earlier',
        item: itemFields(OTHER_ITEM_ID, 'available'),
      },
    ]);
    prismaMock.itemPickupDetail.findMany.mockResolvedValue([pickupRow]);
    const { call, json } = run(CLAIMER_ID);

    await call();

    const { data } = json.mock.calls[0]?.[0] as {
      data: { id: string; pickup: unknown }[];
    };

    expect(data[0]?.pickup).toEqual({
      line1: '123 Main Street',
      line2: null,
      city: 'San Rafael',
      state: 'CA',
      postalCode: '94901',
      instructions: 'Ring the bell twice',
      availability: 'Weekdays after 5pm',
    });
    expect(data[1]?.pickup).toBeNull();
    expect(prismaMock.itemPickupDetail.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { itemId: { in: [ITEM_ID] } } }),
    );
  });

  test('skips the pickup query when no claim is approved', async () => {
    prismaMock.claim.findMany.mockResolvedValue([
      {
        id: 'claim-pending',
        status: 'pending',
        createdAt: 'now',
        item: itemFields(ITEM_ID, 'available'),
      },
    ]);
    const { call } = run(CLAIMER_ID);

    await call();

    expect(prismaMock.itemPickupDetail.findMany).not.toHaveBeenCalled();
  });

  test('turns the photo list into a coverPhoto, or null with no photos', async () => {
    prismaMock.claim.findMany.mockResolvedValue([
      {
        id: 'claim-1',
        status: 'pending',
        createdAt: 'now',
        item: itemFields(ITEM_ID, 'available'),
      },
      {
        id: 'claim-2',
        status: 'declined',
        createdAt: 'before',
        item: { ...itemFields(OTHER_ITEM_ID, 'available'), photos: [] },
      },
    ]);
    const { call, json } = run(CLAIMER_ID);

    await call();

    const { data } = json.mock.calls[0]?.[0] as {
      data: { item: Record<string, unknown> }[];
    };

    expect(data[0]?.item.coverPhoto).toEqual({
      url: 'https://example.com/a.jpg',
      altText: 'Grey stroller',
    });
    expect(data[1]?.item.coverPhoto).toBeNull();
    expect(data[0]?.item).not.toHaveProperty('photos');
  });
});
