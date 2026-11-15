import { z } from 'zod';

export const createAddressSchema = z.object({
  line1: z.string().trim().min(1),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  nickname: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});
