import { describe, test, expect } from '@jest/globals';
import {
  claimStatusSchema,
  listClaimsQuerySchema,
} from '../src/validator/claimList.validator.js';

describe('listClaimsQuerySchema', () => {
  test('accepts a missing status', () => {
    expect(listClaimsQuerySchema.safeParse({}).success).toBe(true);
  });

  test.each(claimStatusSchema.options)('accepts status %s', (status) => {
    expect(listClaimsQuerySchema.safeParse({ status }).success).toBe(true);
  });

  test('rejects an unknown status', () => {
    expect(listClaimsQuerySchema.safeParse({ status: 'maybe' }).success).toBe(
      false,
    );
  });

  test('rejects a status that is not a string', () => {
    expect(
      listClaimsQuerySchema.safeParse({ status: ['pending', 'approved'] })
        .success,
    ).toBe(false);
  });
});
