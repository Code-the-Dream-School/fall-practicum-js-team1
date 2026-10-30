import { describe, expect, it } from 'vitest';
import { formatAgeRange } from './formatAgeRange';

describe('formatAgeRange', () => {
  it('returns All ages when both values are null', () => {
    expect(formatAgeRange(null, null)).toBe('All ages');
  });

  it('returns minimum age with a plus sign', () => {
    expect(formatAgeRange(6, null)).toBe('6+ months');
  });

  it('returns maximum age when minimum is null', () => {
    expect(formatAgeRange(null, 12)).toBe('Up to 12 months');
  });

  it('returns an age range', () => {
    expect(formatAgeRange(0, 6)).toBe('0 to 6 months');
  });

  it('returns one age when both values match', () => {
    expect(formatAgeRange(12, 12)).toBe('12 months');
  });
});
