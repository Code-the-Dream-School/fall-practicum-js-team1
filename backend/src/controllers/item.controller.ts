import type { Response, Request } from 'express';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { z } from 'zod';
import {
  createItemSchema,
  getItemSchema,
} from '../validator/item.validator.js';
import {
  getItemWithCoverPhoto,
  ItemWithPhotos,
  ItemWithCoverPhoto,
} from '../utils/coverPhoto.js';

type ItemFilterParams = {
  NOT: [
    {
      status: 'withdrawn';
    },
  ];
  OR?: [
    {
      title: {
        contains: string;
        mode: 'insensitive';
      };
    },
    {
      description: {
        contains: string;
        mode: 'insensitive';
      };
    },
  ];
  category?: {
    key: string;
  };
  condition?: 'new' | 'like_new' | 'good' | 'used';
  childAgeMinMonths?: {
    lte: number;
  };
  childAgeMaxMonths?: {
    gte: number;
  };
  city?: {
    equals: string;
    mode: 'insensitive';
  };
};

export const getItems = async (req: Request, res: Response): Promise<void> => {
  const result = getItemSchema.safeParse(req.query);

  if (!result.success) {
    throw new ApiError(
      result.error.issues[0]?.message ?? 'Invalid search terms',
      400,
    );
  }

  const { q, category, condition, ageMin, ageMax, city, page, limit } =
    result.data;

  const whereClause: ItemFilterParams = {
    NOT: [{ status: 'withdrawn' }],
  };

  if (q) {
    whereClause['OR'] = [
      {
        title: {
          contains: q,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: q,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (category) {
    whereClause['category'] = { key: category };
  }

  if (condition) {
    whereClause['condition'] = condition;
  }

  if (ageMin !== undefined) {
    whereClause['childAgeMaxMonths'] = { gte: ageMin };
  }

  if (ageMax !== undefined) {
    whereClause['childAgeMinMonths'] = { lte: ageMax };
  }

  if (city) {
    whereClause['city'] = {
      equals: city,
      mode: 'insensitive',
    };
  }

  const itemsRaw = await prisma.item.findMany({
    where: whereClause,
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
    take: limit,
    skip: (page - 1) * limit,
  });

  const items: ItemWithCoverPhoto[] = itemsRaw.map((item: ItemWithPhotos) => {
    return getItemWithCoverPhoto(item);
  });

  const totalItems = await prisma.item.count({
    where: whereClause,
  });
  const pageCount = Math.ceil(totalItems / limit);
  const pagination = {
    page,
    limit,
    total: totalItems,
    pages: pageCount,
    hasPrev: page > 1,
    hasNext: page < pageCount,
  };

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination,
    },
  });
};

export const createItem = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('Not authenticated', 401);
  }

  const result = createItemSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(
      result.error.issues[0]?.message ?? 'Invalid item data',
      400,
    );
  }

  const {
    title,
    description,
    category: categoryKey,
    condition,
    childAgeMinMonths,
    childAgeMaxMonths,
    photos,
    addressId,
    instructions,
    availability,
  } = result.data;

  //Create everything inside one transaction
  const item = await prisma.$transaction(async (tx) => {
    //Find the category using its key
    const category = await tx.category.findUnique({
      where: { key: categoryKey },
      select: { id: true },
    });

    if (!category) {
      throw new ApiError('Category not found', 404);
    }
    //Make sure this address belongs to the signed in user
    const address = await tx.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
      select: {
        city: true,
        state: true,
        postalCode: true,
      },
    });

    if (!address) {
      throw new ApiError('Address not found', 404);
    }
    //Create the item, photos, and pickup details together
    return tx.item.create({
      data: {
        ownerId: userId,
        categoryId: category.id,
        title,
        description,
        condition,
        childAgeMinMonths: childAgeMinMonths ?? null,
        childAgeMaxMonths: childAgeMaxMonths ?? null,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        status: 'available',

        photos: {
          create: photos.map((photo, index) => ({
            url: photo.url,
            publicId: photo.publicId,
            altText: photo.altText ?? null,
            position: index,
          })),
        },

        pickupDetail: {
          create: {
            addressId,
            instructions: instructions ?? null,
            availability: availability ?? null,
          },
        },
      },

      //Return public fields only
      select: {
        id: true,
        title: true,
        description: true,
        condition: true,
        childAgeMinMonths: true,
        childAgeMaxMonths: true,
        city: true,
        state: true,
        postalCode: true,
        status: true,
        createdAt: true,

        category: {
          select: {
            key: true,
            name: true,
          },
        },

        owner: {
          select: {
            id: true,
            name: true,
          },
        },

        photos: {
          select: {
            id: true,
            url: true,
            altText: true,
            position: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  });

  res.status(201).json({
    success: true,
    data: item,
  });
};

export const getItemById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const itemId = req.params.id;

  const result = z.string().uuid().safeParse(itemId);
  if (!result.success) {
    throw new ApiError('Item not found', 404);
  }

  const item = await prisma.item.findUnique({
    where: { id: result.data },
    select: {
      id: true,
      title: true,
      description: true,
      condition: true,
      childAgeMinMonths: true,
      childAgeMaxMonths: true,
      city: true,
      state: true,
      postalCode: true,
      status: true,
      createdAt: true,
      category: {
        select: {
          key: true,
          name: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      photos: {
        orderBy: {
          position: 'asc',
        },
        select: {
          id: true,
          url: true,
          altText: true,
          position: true,
        },
      },
    },
  });
  if (!item) {
    throw new ApiError('Item not found', 404);
  }
  if (item.status === 'withdrawn') {
    throw new ApiError('Item not found', 404);
  }

  res.status(200).json({
    success: true,
    data: item,
  });
};
