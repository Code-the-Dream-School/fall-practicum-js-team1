import { describe, test, expect } from '@jest/globals';
import {
  registerSchema,
  loginSchema,
} from '../src/validator/user.validator.js';

describe('registerSchema', () => {
  const valid = {
    name: 'Sample User',
    email: 'sample@example.com',
    password: 'Passw0rd1',
  };

  test('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  test('lowercases the email', () => {
    const result = registerSchema.safeParse({
      ...valid,
      email: 'Sample@Example.COM',
    });
    expect(result.success && result.data.email).toBe('sample@example.com');
  });

  test('keeps the password exactly as typed (no trimming)', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: ' Passw0rd1 ',
    });
    expect(result.success && result.data.password).toBe(' Passw0rd1 ');
  });

  test('rejects an invalid email', () => {
    expect(
      registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success,
    ).toBe(false);
  });

  test('rejects a name that is too short', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'A' }).success).toBe(
      false,
    );
  });

  test('rejects a password under 8 characters', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'Pass1' }).success,
    ).toBe(false);
  });

  test('rejects a password with no uppercase letter', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'passw0rd1' }).success,
    ).toBe(false);
  });

  test('rejects a password with no lowercase letter', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'PASSW0RD1' }).success,
    ).toBe(false);
  });

  test('rejects a password with no number', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'Password' }).success,
    ).toBe(false);
  });
});

describe('loginSchema', () => {
  const valid = { email: 'sample@example.com', password: 'anything' };

  test('accepts valid input and lowercases the email', () => {
    const result = loginSchema.safeParse({
      ...valid,
      email: 'Sample@Example.COM',
    });
    expect(result.success && result.data.email).toBe('sample@example.com');
  });

  test('rejects an empty password', () => {
    expect(loginSchema.safeParse({ ...valid, password: '' }).success).toBe(
      false,
    );
  });

  test('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(
      false,
    );
  });
});
