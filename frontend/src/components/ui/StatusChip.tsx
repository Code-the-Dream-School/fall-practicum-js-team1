import { Badge } from '@/components/ui/badge';

export type ItemStatus = 'available' | 'reserved' | 'picked_up' | 'withdrawn';
type ClaimStatus =
  'pending' | 'approved' | 'declined' | 'cancelled' | 'no_show' | 'picked_up';

type StatusChipProps =
  { kind: 'item'; status: ItemStatus } | { kind: 'claim'; status: ClaimStatus };

const itemStatusStyles: Record<
  ItemStatus,
  { label: string; className: string }
> = {
  available: {
    label: 'Available',
    className: 'bg-status-available text-status-available-foreground',
  },
  reserved: {
    label: 'Reserved',
    className: 'bg-status-reserved text-status-reserved-foreground',
  },
  picked_up: {
    label: 'Picked up',
    className: 'bg-status-picked-up text-status-picked-up-foreground',
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'bg-status-inactive text-status-inactive-foreground',
  },
};

const claimStatusStyles: Record<
  ClaimStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-status-pending text-status-pending-foreground',
  },
  approved: {
    label: 'Approved',
    className: 'bg-status-approved text-status-approved-foreground',
  },
  declined: {
    label: 'Declined',
    className: 'bg-status-declined text-status-declined-foreground',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-status-inactive text-status-inactive-foreground',
  },
  no_show: {
    label: 'No Show',
    className: 'bg-status-no-show text-status-no-show-foreground',
  },
  picked_up: {
    label: 'Picked up',
    className: 'bg-status-picked-up text-status-picked-up-foreground',
  },
};

export const StatusChip = ({ kind, status }: StatusChipProps) => {
  const entry =
    kind === 'item' ? itemStatusStyles[status] : claimStatusStyles[status];

  return <Badge className={entry.className}>{entry.label}</Badge>;
};
