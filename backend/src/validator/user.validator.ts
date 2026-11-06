import { z } from 'zod';

const NAME_MIN = 2;
const NAME_MAX = 50;
const PASSWORD_MIN = 8;

export const registerSchema = z.object({
  name: z.string().trim().min(NAME_MIN).max(NAME_MAX),
  email: z.email().trim().toLowerCase(),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} letters long`)
    .regex(/[a-z]/, 'Password must contain at least one lowercase')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});
