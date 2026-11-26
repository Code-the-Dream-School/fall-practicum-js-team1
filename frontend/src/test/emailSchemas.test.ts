import { describe, expect, it } from 'vitest';
import { loginSchema } from '@/schemas/loginSchema';
import { registerSchema } from '@/schemas/registerSchema';

const registerValues = {
  name: 'Jane Smith',
  password: 'Password123',
  confirmPassword: 'Password123',
};

describe('email in the login and register forms', () => {
  it('trims and lowercases the email on login', () => {
    const result = loginSchema.parse({
      email: '  Jane@Example.COM ',
      password: 'secret',
    });

    expect(result.email).toBe('jane@example.com');
  });

  it('trims and lowercases the email on register', () => {
    const result = registerSchema.parse({
      ...registerValues,
      email: '  Jane@Example.COM ',
    });

    expect(result.email).toBe('jane@example.com');
  });

  it('still rejects an email that is not valid', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'x',
    });

    expect(result.success).toBe(false);
  });

  it('does not change the password', () => {
    const result = loginSchema.parse({
      email: 'jane@example.com',
      password: ' Secret ',
    });

    expect(result.password).toBe(' Secret ');
  });
});
