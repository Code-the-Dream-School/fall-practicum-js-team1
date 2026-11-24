import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import {
  createClaimSchema,
  decideClaimSchema,
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

export const decideClaim = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('No user is authenticated.', StatusCodes.UNAUTHORIZED);
  }

  const claimId = itemIdSchema.safeParse(req.params.id);

  if (!claimId.success) {
    throw new ApiError('Invalid claim ID', StatusCodes.BAD_REQUEST);
  }

  const body = decideClaimSchema.safeParse(req.body);

  if (!body.success) {
    throw new ApiError(
      body.error.issues[0]?.message ?? 'Invalid claim status',
      StatusCodes.BAD_REQUEST,
    );
  }

  const { status } = body.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({
        where: { id: claimId.data },
        select: {
          id: true,
          itemId: true,
          status: true,
          item: {
            select: {
              ownerId: true,
              status: true,
            },
          },
        },
      });

      if (!claim) {
        throw new ApiError('Claim not found', StatusCodes.NOT_FOUND);
      }

      if (claim.item.ownerId !== userId) {
        throw new ApiError(
          'You are not the owner of this item',
          StatusCodes.FORBIDDEN,
        );
      }

      if (claim.status !== 'pending') {
        throw new ApiError(
          'Only pending claims can be approved or declined',
          StatusCodes.CONFLICT,
        );
      }

      if (status === 'declined') {
        const updated = await tx.claim.updateMany({
          where: {
            id: claim.id,
            status: 'pending',
          },
          data: {
            status: 'declined',
            decidedAt: new Date(),
          },
        });

        if (updated.count !== 1) {
          throw new ApiError(
            'This claim is no longer pending',
            StatusCodes.CONFLICT,
          );
        }

        return { id: claim.id, status: 'declined' as const };
      }

      const approvedClaim = await tx.claim.findFirst({
        where: {
          itemId: claim.itemId,
          status: 'approved',
        },
        select: { id: true },
      });

      if (approvedClaim) {
        throw new ApiError(
          'This item already has an approved claim. Release it first.',
          StatusCodes.CONFLICT,
        );
      }

      if (claim.item.status !== 'available') {
        throw new ApiError(
          'This item is not available for approval',
          StatusCodes.CONFLICT,
        );
      }

      const reserved = await tx.item.updateMany({
        where: {
          id: claim.itemId,
          status: 'available',
        },
        data: {
          status: 'reserved',
          reservedAt: new Date(),
        },
      });

      if (reserved.count !== 1) {
        throw new ApiError(
          'This item is no longer available for approval',
          StatusCodes.CONFLICT,
        );
      }

      const updated = await tx.claim.updateMany({
        where: {
          id: claim.id,
          status: 'pending',
        },
        data: {
          status: 'approved',
          decidedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new ApiError(
          'This claim is no longer pending',
          StatusCodes.CONFLICT,
        );
      }

      return { id: claim.id, status: 'approved' as const };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2002' || error.code === 'P2034')
    ) {
      throw new ApiError(
        'Claim approval conflict. Please try again.',
        StatusCodes.CONFLICT,
      );
    }

    throw error;
  }
};
