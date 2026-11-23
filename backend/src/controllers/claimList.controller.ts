import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { itemIdSchema } from '../validator/claim.validator.js';
import { listClaimsQuerySchema } from '../validator/claimList.validator.js';

const parseStatus = (query: unknown) => {
  const parsed = listClaimsQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new ApiError('Invalid claim status', StatusCodes.BAD_REQUEST);
  }

  return parsed.data.status;
};

export const getItemClaims = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('No user is authenticated.', StatusCodes.UNAUTHORIZED);
  }

  const itemId = itemIdSchema.safeParse(req.params.id);

  if (!itemId.success) {
    throw new ApiError('Invalid item ID', StatusCodes.BAD_REQUEST);
  }

  const status = parseStatus(req.query);

  const item = await prisma.item.findUnique({
    where: { id: itemId.data },
    select: { ownerId: true },
  });

  if (!item) {
    throw new ApiError('Item not found', StatusCodes.NOT_FOUND);
  }

  if (item.ownerId !== userId) {
    throw new ApiError(
      'You are not the owner of this item',
      StatusCodes.FORBIDDEN,
    );
  }

  const claims = await prisma.claim.findMany({
    where: { itemId: itemId.data, ...(status && { status }) },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      itemId: true,
      status: true,
      message: true,
      createdAt: true,
      claimer: { select: { id: true, name: true } },
    },
  });

  res.status(StatusCodes.OK).json({ success: true, data: claims });
};

export const getMyClaims = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('No user is authenticated.', StatusCodes.UNAUTHORIZED);
  }

  const status = parseStatus(req.query);

  // the pickup address is NOT part of this query, so it can never leak by accident
  const claims = await prisma.claim.findMany({
    where: { claimerId: userId, ...(status && { status }) },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      item: {
        select: {
          id: true,
          title: true,
          status: true,
          owner: { select: { id: true, name: true } },
          photos: {
            orderBy: { position: 'asc' },
            take: 1,
            select: { url: true, altText: true },
          },
        },
      },
    },
  });

  // only approved claims get the private pickup info, loaded in a second query
  const approvedItemIds = claims
    .filter((claim) => claim.status === 'approved')
    .map((claim) => claim.item.id);

  const pickupDetails =
    approvedItemIds.length === 0
      ? []
      : await prisma.itemPickupDetail.findMany({
          where: { itemId: { in: approvedItemIds } },
          select: {
            itemId: true,
            instructions: true,
            availability: true,
            address: {
              select: {
                line1: true,
                line2: true,
                city: true,
                state: true,
                postalCode: true,
              },
            },
          },
        });

  const pickupByItem = new Map(
    pickupDetails.map((detail) => [
      detail.itemId,
      {
        ...detail.address,
        instructions: detail.instructions,
        availability: detail.availability,
      },
    ]),
  );

  const data = claims.map(({ item, ...claim }) => {
    const { photos, ...itemFields } = item;

    return {
      ...claim,
      item: { ...itemFields, coverPhoto: photos[0] ?? null },
      pickup:
        claim.status === 'approved'
          ? (pickupByItem.get(item.id) ?? null)
          : null,
    };
  });

  res.status(StatusCodes.OK).json({ success: true, data });
};
