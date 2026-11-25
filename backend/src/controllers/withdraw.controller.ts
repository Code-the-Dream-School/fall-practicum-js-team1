import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { itemIdSchema } from '../validator/claim.validator.js';
import { StatusCodes } from 'http-status-codes';

export const withdrawItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError('No user is authenticated', StatusCodes.UNAUTHORIZED);
  }

  const itemId = itemIdSchema.safeParse(req.params.id);
  if (!itemId.success) {
    throw new ApiError('Invalid item ID', StatusCodes.BAD_REQUEST);
  }

  const item = await prisma.item.findUnique({
    where: {
      id: itemId.data,
    },
  });

  if (!item) {
    throw new ApiError('Unknown item', StatusCodes.NOT_FOUND); //whether ID actually exists in the database
  }

  if (item.ownerId !== userId) {
    throw new ApiError(
      'You are not the owner of this item',
      StatusCodes.FORBIDDEN,
    );
  }

  if (item.status !== 'available' && item.status !== 'reserved') {
    throw new ApiError(
      'Item status is not available or reserved',
      StatusCodes.CONFLICT,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.item.updateMany({
      where: {
        id: itemId.data,
        status: { in: ['available', 'reserved'] },
      },
      data: {
        status: 'withdrawn',
        reservedAt: null,
      },
    });

    if (item.count !== 1) {
      throw new ApiError('Item status has changed', StatusCodes.CONFLICT);
    }

    const now = new Date();

    await tx.claim.updateMany({
      where: {
        itemId: itemId.data,
        status: 'pending',
      },
      data: {
        status: 'declined',
        decidedAt: now,
      },
    });

    await tx.claim.updateMany({
      where: {
        itemId: itemId.data,
        status: 'approved',
      },
      data: {
        status: 'cancelled',
      },
    });
    return { id: itemId.data, status: 'withdrawn' as const };
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
};

export const restoreItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError('No user is authenticated', StatusCodes.UNAUTHORIZED);
  }

  const itemId = itemIdSchema.safeParse(req.params.id);
  if (!itemId.success) {
    throw new ApiError('Invalid item ID', StatusCodes.BAD_REQUEST);
  }

  const item = await prisma.item.findUnique({
    where: {
      id: itemId.data,
    },
  });

  if (!item) {
    throw new ApiError('Unknown item', StatusCodes.NOT_FOUND);
  }
  if (item.ownerId !== userId) {
    throw new ApiError(
      'You are not the owner of this item',
      StatusCodes.FORBIDDEN,
    );
  }

  if (item.status !== 'withdrawn') {
    throw new ApiError('Item is not withdrawn', 409);
  }

  const updatedItem = await prisma.item.updateMany({
    where: {
      id: itemId.data,
      status: 'withdrawn',
    },
    data: {
      status: 'available',
    },
  });

  if (updatedItem.count !== 1) {
    throw new ApiError('Item status has changed', 409);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: { id: itemId.data, status: 'available' },
  });
};
