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
    expect(formatAgeRange(null, 9)).toBe('Up to 9 months');
  });

  it('returns an age range', () => {
    expect(formatAgeRange(0, 6)).toBe('0 to 6 months');
  });

  it('returns one age when both values match', () => {
    expect(formatAgeRange(9, 9)).toBe('9 months');
  });

  it('shows whole years as years', () => {
    expect(formatAgeRange(0, 36)).toBe('0 to 3 years');
    expect(formatAgeRange(null, 24)).toBe('Up to 2 years');
    expect(formatAgeRange(36, null)).toBe('3+ years');
  });

  it('uses the singular for one year', () => {
    expect(formatAgeRange(12, 12)).toBe('1 year');
    expect(formatAgeRange(null, 12)).toBe('Up to 1 year');
  });

  it('keeps months when they are not whole years', () => {
    expect(formatAgeRange(18, null)).toBe('18+ months');
  });

  it('shows a unit on both numbers when the units differ', () => {
    expect(formatAgeRange(6, 24)).toBe('6 months to 2 years');
  });
});
