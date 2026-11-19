import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from './apiError.js';

export const loadClaimForParticipant = async (
  claimId: string,
  userId: string,
) => {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { item: { select: { ownerId: true } } },
  });

  if (!claim) {
    throw new ApiError('Claim not found', StatusCodes.NOT_FOUND);
  }

  const isClaimer = claim.claimerId === userId;
  const isOwner = claim.item.ownerId === userId;

  if (!isClaimer && !isOwner) {
    throw new ApiError('You are not part of this claim', StatusCodes.FORBIDDEN);
  }

  return claim;
};
