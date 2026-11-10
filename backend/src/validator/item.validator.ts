import { z } from 'zod'

export const getItemSchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'use']).optional(),
  ageMin: z.int().optional(),
  ageMax: z.int().optional(),
  city: z.string().trim().min(1).optional(),
  page: z.int().default(1),
  limit: z.int().gt(0).lte(50).default(12),
})
