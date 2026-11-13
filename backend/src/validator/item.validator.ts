import { z } from 'zod';

const photoSchema = z.object({
  url: z.url().refine(
    (url) => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

      return (
        Boolean(cloudName) &&
        url.startsWith(`https://res.cloudinary.com/${cloudName}/`)
      );
    },
    {
      message: `Photo URL must belong to this project Cloudinary account`,
    },
  ),
  publicId: z.string().trim().min(1),
  altText: z.string().trim().max(200).optional(),
});

export const createItemSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(1000),
    category: z.string().trim().min(1),
    condition: z.enum(['new', 'like_new', 'good', 'used']),
    childAgeMinMonths: z.number().int().min(0).max(120).optional(),
    childAgeMaxMonths: z.number().int().min(0).max(120).optional(),
    photos: z.array(photoSchema).min(1).max(6),
    addressId: z.uuid(),
    instructions: z.string().trim().min(1).max(300).optional(),
    availability: z.string().trim().min(1).max(200).optional(),
  })
  .refine(
    (data) =>
      data.childAgeMinMonths === undefined ||
      data.childAgeMaxMonths === undefined ||
      data.childAgeMinMonths <= data.childAgeMaxMonths,
    {
      message: 'Minimum child age cannot exceed maximum child age',
      path: ['childAgeMaxMonths'],
    },
  );
