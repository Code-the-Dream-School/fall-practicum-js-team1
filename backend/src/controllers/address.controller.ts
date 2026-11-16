import type { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/jwtMiddleware.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { createAddressSchema } from '../validator/address.validator.js';

export const getAddresses = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError('Not authenticated', 401);
  }

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  console.log('Addresses found:', addresses.length);
  console.log('Addresses:', addresses);

  res.status(200).json({
    success: true,
    data: addresses,
  });
};

export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('Not authenticated', 401);
  }

  const result = createAddressSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(
      result.error.issues[0]?.message ?? 'Invalid address data',
      400,
    );
  }

  const { line1, line2, city, state, postalCode, nickname, isDefault } =
    result.data;

  const address = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.address.count({
      where: { userId },
    });

    const shouldBeDefault = existingCount === 0 || isDefault === true;

    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    return tx.address.create({
      data: {
        userId,
        line1,
        line2: line2 || null,
        city,
        state,
        postalCode,
        nickname: nickname || null,
        isDefault: shouldBeDefault,
      },
    });
  });

  res.status(201).json({
    success: true,
    data: address,
  });
};
