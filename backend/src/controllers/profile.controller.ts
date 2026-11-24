import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { getItemWithCoverPhoto } from '../utils/coverPhoto.js';


export const getMyItems = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('Not authenticated', 401);
  }

  const itemsRaw = await prisma.item.findMany({
    where: {
      ownerId: userId,
    },
    select: {
      id: true,
      title: true,
      condition: true,
      childAgeMinMonths: true,
      childAgeMaxMonths: true,
      city: true,
      state: true,
      status: true,
      category: {
        select: {
          key: true,
          name: true,
        },
      },
      photos: {
        select: {
          url: true,
          altText: true,
          position: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const items = itemsRaw.map((item) => getItemWithCoverPhoto(item));
  res.status(200).json({
    success: true,
    data: items,
  });
};

export const getMyStats = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('Not authenticated', 401);
  }

  const totalPostedDonations = await prisma.item.count({
    where: {
      ownerId: userId,
      NOT: {
        status: 'withdrawn',
      },
    },
  });

  const countItems = (status: 'pending' | 'approved' | 'picked_up') =>
    prisma.item.count({
      where: { ownerId: userId, claims: { some: { status } } },
    });

  const [myDonationsPending, myDonationsApproved, myDonationsPickedUp] =
    await Promise.all([
      countItems('pending'),
      countItems('approved'),
      countItems('picked_up'),
    ]);

  const countClaims = (status?: 'pending' | 'approved' | 'picked_up') =>
    prisma.claim.count({
      where: { claimerId: userId, ...(status ? { status } : {}) },
    });

  const [myClaimCount, myClaimsPending, myClaimsApproved, myClaimsPickedUp] =
    await Promise.all([
      countClaims(),
      countClaims('pending'),
      countClaims('approved'),
      countClaims('picked_up'),
    ]);

  res.status(200).json({
    success: true,
    data: {
      donations: {
        posted: totalPostedDonations,
        waitingForYou: myDonationsPending,
        approved: myDonationsApproved,
        pickedUp: myDonationsPickedUp,
      },
      claims: {
        requested: myClaimCount,
        waitingForOwner: myClaimsPending,
        approved: myClaimsApproved,
        pickedUp: myClaimsPickedUp,
      },
    },
  });
};
