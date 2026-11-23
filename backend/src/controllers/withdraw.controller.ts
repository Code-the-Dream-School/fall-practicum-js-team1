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
    throw new ApiError('No user is authenticated', 401);
  }
  const requestId = req.params.id;
  if (!requestId) {
    throw new ApiError('Unknown item', 404); //whether an ID was provided
  }

  const itemId = itemIdSchema.safeParse(requestId);
  if (!itemId.success) {
    throw new ApiError('Invalid item ID', StatusCodes.BAD_REQUEST);
  }

  const item = await prisma.item.findUnique({
    where: {
      id: itemId.data,
    },
  });

  if (!item) {
    throw new ApiError('Unknown item', 404); //whether ID actually exists in the database
  }

  if (item.ownerId !== userId) {
    throw new ApiError('You are not the owner of this item', 403);
  }

  if (item.status !== 'available' && item.status !== 'reserved') {
    throw new ApiError('Item status is not available or reserved', 409);
  }

  const updatedItem = await prisma.$transaction(async (tx) => {
    const item = await tx.item.update({
      where: {
        id: itemId.data,
      },
      data: {
        status: 'withdrawn',
        reservedAt: null,
      },
    });

    await tx.claim.updateMany({
      where: {
        itemId: itemId.data,
        status: 'pending',
      },
      data: {
        status: 'declined',
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
    return item;
  });
  res.status(StatusCodes.OK).json({
    success: true,
    data: updatedItem,
  });
};

export const restoreItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError('No user is authenticated', 401);
  }
  const requestId = req.params.id;
  if (!requestId) {
    throw new ApiError('Unknown item', 404);
  }
  const itemId = itemIdSchema.safeParse(requestId);
  if (!itemId.success) {
    throw new ApiError('Invalid item ID', StatusCodes.BAD_REQUEST);
  }

  const item = await prisma.item.findUnique({
    where: {
      id: itemId.data,
    },
  });

  if (!item) {
    throw new ApiError('Unknown item', 404);
  }
  if (item.ownerId !== userId) {
    throw new ApiError('You are not the owner of this item', 403);
  }

  if (item.status !== 'withdrawn') {
    throw new ApiError('Item is not withdrawn', 409);
  }

  const updatedItem = await prisma.item.update({
    where: {
      id: itemId.data,
    },
    data: {
      status: 'available',
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: updatedItem,
  });
};
