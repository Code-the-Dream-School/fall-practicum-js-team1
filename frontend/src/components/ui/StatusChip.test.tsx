import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  describe('item statuses', () => {
    const cases = [
      ['available', 'Available'],
      ['reserved', 'Reserved'],
      ['picked_up', 'Picked up'],
      ['withdrawn', 'Withdrawn'],
    ] as const;

    it.each(cases)('shows %s as %s', (status, label) => {
      render(<StatusChip type="item" status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('claim statuses', () => {
    const cases = [
      ['pending', 'Waiting for owner'],
      ['approved', 'Approved'],
      ['declined', 'Declined'],
      ['cancelled', 'Cancelled'],
      ['no_show', 'No show'],
      ['picked_up', 'Picked up'],
    ] as const;

    it.each(cases)('shows %s as %s', (status, label) => {
      render(<StatusChip type="claim" status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
