import { z } from 'zod';

export const claimStatusSchema = z.enum([
  'pending',
  'approved',
  'declined',
  'cancelled',
  'no_show',
  'picked_up',
]);

export const listClaimsQuerySchema = z.object({
  status: claimStatusSchema.optional(),
});
