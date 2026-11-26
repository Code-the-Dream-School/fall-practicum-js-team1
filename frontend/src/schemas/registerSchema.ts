import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;

// The server only accepts plain a-z, A-Z and 0-9 for these checks.
const hasCharBetween = (value: string, first: string, last: string) =>
  [...value].some((char) => char >= first && char <= last);

export const passwordRules = [
  {
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    test: (value: string) => value.length >= MIN_PASSWORD_LENGTH,
  },
  {
    label: '1 lowercase letter',
    message: 'Password needs at least 1 lowercase letter',
    test: (value: string) => hasCharBetween(value, 'a', 'z'),
  },
  {
    label: '1 capital letter',
    message: 'Password needs at least 1 capital letter',
    test: (value: string) => hasCharBetween(value, 'A', 'Z'),
  },
  {
    label: '1 number',
    message: 'Password needs at least 1 number',
    test: (value: string) => hasCharBetween(value, '0', '9'),
  },
];

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be 2 to 50 characters')
      .max(50, 'Name must be 2 to 50 characters'),

    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),

    password: passwordRules.reduce(
      (schema, rule) => schema.refine(rule.test, rule.message),
      z.string(),
    ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
