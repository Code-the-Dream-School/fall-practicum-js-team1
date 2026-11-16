import type { Request, Response } from 'express';
import { prisma } from '../config/db.prisma.js';

export const getCategories = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      key: true,
      name: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  res.status(200).json({
    success: true,
    data: categories,
  });
};
