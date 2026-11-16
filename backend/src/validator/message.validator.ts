import { z } from 'zod';

const BODY_MIN = 1;
const BODY_MAX = 2000;

export const claimIdSchema = z.uuid();

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(BODY_MIN, `Message must be at least ${BODY_MIN} character long`)
    .max(BODY_MAX, `Message must be at most ${BODY_MAX} characters long`),
});
