import { z } from 'zod';

const MESSAGE_MAX = 500;

export const itemIdSchema = z.uuid();

export const createClaimSchema = z.object({
  message: z
    .string()
    .trim()
    .max(MESSAGE_MAX, `Message must be at most ${MESSAGE_MAX} characters long`)
    .optional(),
});
