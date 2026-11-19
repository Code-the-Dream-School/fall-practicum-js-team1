import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import {
  createClaimSchema,
  itemIdSchema,
} from '../validator/claim.validator.js';

const CLOSED_ITEM_STATUSES = ['picked_up', 'withdrawn'];

export const createClaim = async (
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

  const body = createClaimSchema.safeParse(req.body);

  if (!body.success) {
    throw new ApiError(
      body.error.issues[0]?.message ?? 'Invalid data',
      StatusCodes.BAD_REQUEST,
    );
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId.data },
    select: { id: true, ownerId: true, status: true },
  });

  if (!item) {
    throw new ApiError('Item not found', StatusCodes.NOT_FOUND);
  }

  if (item.ownerId === userId) {
    throw new ApiError('You cannot claim your own item', StatusCodes.FORBIDDEN);
  }

  if (CLOSED_ITEM_STATUSES.includes(item.status)) {
    throw new ApiError(
      'This item is no longer available',
      StatusCodes.CONFLICT,
    );
  }

  try {
    const claim = await prisma.claim.create({
      data: {
        itemId: item.id,
        claimerId: userId,
        message: body.data.message || null,
      },
      select: { id: true, itemId: true, status: true },
    });

    res.status(StatusCodes.CREATED).json({ success: true, data: claim });
  } catch (error) {
    // the database allows one pending or approved claim per user and item
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ApiError(
        'You already have an active claim on this item',
        StatusCodes.CONFLICT,
      );
    }

    throw error;
  }
};
