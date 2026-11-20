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

  const postedDonations = await prisma.item.count({
    where: {
      ownerId: userId,
      NOT: {
        status: 'withdrawn',
      },
    },
  })

  const _stats = await prisma.$queryRaw`
  `

  /*
   * This needs to be raw sql b/c prisma doesn't support groupBy for relations:
   * https://github.com/prisma/orm/issues/8744
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
        posted: postedDonations,
      },
    },
  })
}
