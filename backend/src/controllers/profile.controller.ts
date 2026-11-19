import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { getItemWithCoverPhoto } from '../utils/coverPhoto.js';

import { getProfileStatsMyDonationsClaimed } from '../generated/prisma/sql.js';

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

  /*
   * This query needs to use raw sql b/c prisma doesn't support groupBy for
   * relations:
   * https://github.com/prisma/orm/issues/8744
   */
  const donationStats = await prisma.$queryRawTyped(
    getProfileStatsMyDonationsClaimed(userId),
  );

  let myDonationsPending = 0;
  let myDonationsApproved = 0;
  let myDonationsPickedUp = 0;

  donationStats.forEach((stats) => {
    switch (stats.status) {
      case 'pending':
        myDonationsPending = Number(stats.count);
        break;
      case 'approved':
        myDonationsApproved = Number(stats.count);
        break;
      case 'picked_up':
        myDonationsPickedUp = Number(stats.count);
        break;
    }
  });

  const myClaimStats = await prisma.claim.groupBy({
    by: ['status'],
    where: {
      claimerId: userId,
    },
    _count: {
      status: true,
    },
  });

  let myClaimsPending = 0;
  let myClaimsApproved = 0;
  let myClaimsPickedUp = 0;
  let myClaimCount = 0;

  myClaimStats.forEach((stats) => {
    myClaimCount += 1;
    switch (stats.status) {
      case 'pending':
        myClaimsPending = Number(stats._count.status);
        break;
      case 'approved':
        myClaimsApproved = Number(stats._count.status);
        break;
      case 'picked_up':
        myClaimsPickedUp = Number(stats._count.status);
        break;
      default:
        break;
    }
  });

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
