/*
GET /api/profile/items (signed in) returns the user's items, newest first, in the item summary shape plus status; withdrawn items are included, so the owner can restore them

GET /api/profile/stats returns { donations: { posted, waitingForYou, approved, pickedUp }, claims: { requested, waitingForOwner, approved, pickedUp } }

donations.posted does not count withdrawn items; donations.waitingForYou counts pending claims on the user's items and donations.approved counts the user's items with an approved claim; the claims group counts the user's own claims by those statuses

Numbers are calculated with database counts, not by loading every row

A user with no data gets zeros, not an error

Errors use ApiError; responses follow { success, data }
*/

import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';

export const getMyItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        }
      },
      photos: {
        select: {
          url: true,
          altText: true,
          position: true,
        }
      },
    },
  })

  // TODO: mutate items to include coverPHoto
  const items = itemsRaw.map(item => item)
  res.status(200).json({
    success: true,
    data: items,
  })
}

export const getMyStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('Not authenticated', 401);
  }

  /*
  const postedDonations = await prisma.item.count({
    where: {
      ownerId: userId,
      NOT: {
        status: 'withdrawn',
      },
    },
  })
 */

  const donations = await prisma.item.groupBy({
    by: ['status'],
    where: {
      ownerId: userId,
      NOT: {
        status: 'withdrawn',
      },
    },
    _count: {
      status: true,
    }
  })
  console.log('donations:', donations)
  const totalPostedDonations: number = donations.reduce(
    (total, statusCount) => {
      return total + (statusCount?._count?.status || 0)
    },
    0
  )
  //*/
  const stats = await prisma.$queryRaw`
    SELECT c.status, COUNT(c.status) FROM claims c
    LEFT JOIN items i ON i.id = c.item_id
    WHERE i.owner_id = ${userId}
    GROUP BY c.status
  `
  console.log(stats)
  console.log(Number(stats[0].count) + Number(stats[1].count))

  /*
   * This needs to be raw sql b/c prisma doesn't support groupBy for relations:
   * https://github.com/prisma/orm/issues/8744
  "data": {
    "donations": {
      "posted": 5,
      "waitingForYou": 2,
      "approved": 1,
      "pickedUp": 2
    },
    "claims": {
      "requested": 3,
      "waitingForOwner": 1,
      "approved": 1,
      "pickedUp": 1
    }
  }
  const donationsWithClaims = await prisma.item.groupBy({
    by: ['status'],
    where: {
      include: {

      }
    },

  })
  */

  res.status(200).json({
    success: true,
    data: {
      donations: {
        posted: totalPostedDonations,
      },
    },
  })
}
