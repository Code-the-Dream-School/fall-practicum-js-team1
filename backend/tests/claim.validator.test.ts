import { describe, test, expect } from '@jest/globals';
import {
  createClaimSchema,
  itemIdSchema,
} from '../src/validator/claim.validator.js';

const MESSAGE_MAX = 500;
const NOT_A_STRING = 5;

describe('createClaimSchema', () => {
  test('accepts an empty body, because the message is optional', () => {
    expect(createClaimSchema.safeParse({}).success).toBe(true);
  });

  test('trims the message', () => {
    const result = createClaimSchema.safeParse({ message: '  Hi  ' });

    expect(result.success && result.data.message).toBe('Hi');
  });

  test('accepts a message of exactly 500 characters', () => {
    const result = createClaimSchema.safeParse({
      message: 'a'.repeat(MESSAGE_MAX),
    });

    expect(result.success).toBe(true);
  });

  test('rejects a message longer than 500 characters', () => {
    const result = createClaimSchema.safeParse({
      message: 'a'.repeat(MESSAGE_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  test('rejects a message that is not a string', () => {
    expect(createClaimSchema.safeParse({ message: NOT_A_STRING }).success).toBe(
      false,
    );
  });
});

describe('itemIdSchema', () => {
  test('accepts a UUID', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';

    expect(itemIdSchema.safeParse(id).success).toBe(true);
  });

  test('rejects anything that is not a UUID', () => {
    expect(itemIdSchema.safeParse('123').success).toBe(false);
    expect(itemIdSchema.safeParse(undefined).success).toBe(false);
  });
});
