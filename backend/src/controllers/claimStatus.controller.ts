import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { idSchema } from '../validator/claimStatus.validator.js';

const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('No user is authenticated.', StatusCodes.UNAUTHORIZED);
  }

  return userId;
};

const parseId = (value: unknown, label: string): string => {
  const id = idSchema.safeParse(value);

  if (!id.success) {
    throw new ApiError(`Invalid ${label} ID`, StatusCodes.BAD_REQUEST);
  }

  return id.data;
};

export const cancelClaim = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);
  const claimId = parseId(req.params.id, 'claim');

  const result = await prisma.$transaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: { id: claimId },
      select: { id: true, itemId: true, claimerId: true, status: true },
    });

    if (!claim) {
      throw new ApiError('Claim not found', StatusCodes.NOT_FOUND);
    }

    if (claim.claimerId !== userId) {
      throw new ApiError(
        'You are not the claimer of this claim',
        StatusCodes.FORBIDDEN,
      );
    }

    if (claim.status !== 'pending' && claim.status !== 'approved') {
      throw new ApiError(
        'Only pending or approved claims can be cancelled',
        StatusCodes.CONFLICT,
      );
    }

    // the status in "where" makes sure nothing changed since the claim was read
    const cancelled = await tx.claim.updateMany({
      where: { id: claim.id, status: claim.status },
      data: { status: 'cancelled' },
    });

    if (cancelled.count !== 1) {
      throw new ApiError(
        'This claim can no longer be cancelled',
        StatusCodes.CONFLICT,
      );
    }

    if (claim.status === 'approved') {
      const released = await tx.item.updateMany({
        where: { id: claim.itemId, status: 'reserved' },
        data: { status: 'available', reservedAt: null },
      });

      if (released.count !== 1) {
        throw new ApiError(
          'The item is not reserved any more',
          StatusCodes.CONFLICT,
        );
      }
    }

    return { id: claim.id, status: 'cancelled' as const };
  });

  res.status(StatusCodes.OK).json({ success: true, data: result });
};

export const markNoShow = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);
  const claimId = parseId(req.params.id, 'claim');

  const result = await prisma.$transaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        itemId: true,
        status: true,
        item: { select: { ownerId: true } },
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

    if (claim.status !== 'approved') {
      throw new ApiError(
        'Only approved claims can be marked as no-show',
        StatusCodes.CONFLICT,
      );
    }

    const updated = await tx.claim.updateMany({
      where: { id: claim.id, status: 'approved' },
      data: { status: 'no_show' },
    });

    if (updated.count !== 1) {
      throw new ApiError(
        'This claim is no longer approved',
        StatusCodes.CONFLICT,
      );
    }

    const released = await tx.item.updateMany({
      where: { id: claim.itemId, status: 'reserved' },
      data: { status: 'available', reservedAt: null },
    });

    if (released.count !== 1) {
      throw new ApiError(
        'The item is not reserved any more',
        StatusCodes.CONFLICT,
      );
    }

    return { id: claim.id, status: 'no_show' as const };
  });

  res.status(StatusCodes.OK).json({ success: true, data: result });
};

export const markItemPickedUp = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = requireUserId(req);
  const itemId = parseId(req.params.id, 'item');

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({
      where: { id: itemId },
      select: { id: true, ownerId: true, status: true },
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

    if (item.status !== 'reserved') {
      throw new ApiError('The item is not reserved', StatusCodes.CONFLICT);
    }

    const now = new Date();

    const updated = await tx.item.updateMany({
      where: { id: item.id, status: 'reserved' },
      data: { status: 'picked_up', pickedUpAt: now },
    });

    if (updated.count !== 1) {
      throw new ApiError('The item is not reserved', StatusCodes.CONFLICT);
    }

    const pickedUp = await tx.claim.updateMany({
      where: { itemId: item.id, status: 'approved' },
      data: { status: 'picked_up', pickedUpAt: now },
    });

    // a reserved item must have an approved claim, otherwise undo everything
    if (pickedUp.count !== 1) {
      throw new ApiError(
        'This item has no approved claim',
        StatusCodes.CONFLICT,
      );
    }

    // nobody else can get the item now, so the waiting list is closed
    await tx.claim.updateMany({
      where: { itemId: item.id, status: 'pending' },
      data: { status: 'declined', decidedAt: now },
    });

    return { id: item.id, status: 'picked_up' as const };
  });

  res.status(StatusCodes.OK).json({ success: true, data: result });
};
