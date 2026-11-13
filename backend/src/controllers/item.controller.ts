import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { createItemSchema } from '../validator/item.validator.js';

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
    categoryKey,
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
