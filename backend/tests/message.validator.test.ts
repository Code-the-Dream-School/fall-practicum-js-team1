import { describe, test, expect } from '@jest/globals';
import {
  claimIdSchema,
  sendMessageSchema,
} from '../src/validator/message.validator.js';

describe('claimIdSchema', () => {
  test('accepts a UUID', () => {
    const id = '9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d';
    expect(claimIdSchema.safeParse(id).success).toBe(true);
  });

  test('rejects text that is not a UUID', () => {
    expect(claimIdSchema.safeParse('123').success).toBe(false);
  });
});

describe('sendMessageSchema', () => {
  test('accepts a normal message', () => {
    expect(sendMessageSchema.safeParse({ body: 'Hello there' }).success).toBe(
      true,
    );
  });

  test('trims the body', () => {
    const result = sendMessageSchema.safeParse({ body: '  Hello  ' });
    expect(result.success && result.data.body).toBe('Hello');
  });

  test('rejects a body with only spaces', () => {
    expect(sendMessageSchema.safeParse({ body: '   ' }).success).toBe(false);
  });

  test('rejects a missing body', () => {
    expect(sendMessageSchema.safeParse({}).success).toBe(false);
  });

  test('accepts exactly 2000 characters', () => {
    const body = 'a'.repeat(2000);
    expect(sendMessageSchema.safeParse({ body }).success).toBe(true);
  });

  test('rejects 2001 characters', () => {
    const body = 'a'.repeat(2001);
    expect(sendMessageSchema.safeParse({ body }).success).toBe(false);
  });
});
