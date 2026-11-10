import type { Request, Response } from 'express'

import { prisma } from '../config/db.prisma.js';
import { getItemSchema } from '../validator/item.validator.js'
import { ApiError } from '../utils/apiError.js'
import {
  getItemWithCoverPhoto,
  ItemWithPhotos,
  ItemWithCoverPhoto,
} from '../utils/coverPhoto.js'

type ItemFilterParams = {
  NOT: [
    {
      status: 'withdrawn'
    }
  ]
  //*
  OR?: {
    [key: string]: unknown,
  }[],
  //*/
 /*
  OR?: [
    {
      title: {
        contains: string,
        mode: string,
      }
    },
    {
      description: {
        contains: string,
        mode: string,
      }
    }
  ],
  */
  category?: {
    key: string,
  },
  condition?: string,
  ageMin?: {
    gte: number
  },
  ageMax?: {
    lte: number
  },
  city?: {
    equals: string,
    mode: string,
  }
}
export const getAllItems = async (req: Request, res: Response): Promise<void> => {
  const result = getItemSchema.safeParse(req.query)

  if (!result.success) {
    throw new ApiError(
      result.error.issues[0]?.message ?? 'Invalid search terms',
      400
    )
  }

  const {
    q,
    category,
    condition,
    ageMin,
    ageMax,
    city,
    page,
    limit,
  } = result.data

  const whereClause: ItemFilterParams = {
    NOT: [
      { status: 'withdrawn' }
    ]
  }

  if (q) {
    whereClause['OR'] = [
      {
        title: {
          contains: q,
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: q,
          mode: 'insensitive'
        }
      },
    ]
  }

  if (category) {
    whereClause['category'] = { key: category }
  }

  if (condition) {
    whereClause['condition'] = condition
  }

  if (ageMin) {
    whereClause['ageMin'] = { gte: ageMin }
  }

  if (ageMax) {
    whereClause['ageMax'] = { lte: ageMax }
  }

  if (city) {
    whereClause['city'] = {
      equals: city,
      mode: 'insensitive',
    }
  }

  const itemsRaw = await prisma.item.findMany({
    where: whereClause,
    include: {
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
      }
    },
    select: {
      id: true,
      title: true,
      condition: true,
      category: true,
      childAgeMinMonths: true,
      childAgeMaxMonths: true,
      city: true,
      state: true,
      status: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: page * limit,
  })

  const items: ItemWithCoverPhoto[] = itemsRaw.map((item: ItemWithPhotos) => {
    return getItemWithCoverPhoto(item)
  });

  res.status(200).json({
    success: true,
    data: {
      items
    }
  });
  //*/
}
