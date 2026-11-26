import { z } from 'zod';

export const passwordRules = [
  {
    label: 'At least 8 characters',
    test: (value: string) => value.length >= 8,
  },
  { label: '1 lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: '1 capital letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: '1 number', test: (value: string) => /[0-9]/.test(value) },
];

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be 2 to 50 characters')
      .max(50, 'Name must be 2 to 50 characters'),

    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),

    password: z
      .string()
      .refine(
        (value) => passwordRules.every((rule) => rule.test(value)),
        'Password does not meet the requirements',
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
