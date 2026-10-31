
import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(50),

    email: z.email('Enter a valid email'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password needs at least 1 lowercase letter')
      .regex(/[A-Z]/, 'Password needs at least 1 capital letter')
      .regex(/[0-9]/, 'Password needs at least 1 number'),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
