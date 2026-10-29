type ItemStatus = 'available' | 'reserved' | 'picked_up' | 'withdrawn';

type ClaimStatus =
  'pending' | 'approved' | 'declined' | 'cancelled' | 'no_show' | 'picked_up';

type StatusChipProps =
  { type: 'item'; status: ItemStatus } | { type: 'claim'; status: ClaimStatus };

const labels = {
  item: {
    available: 'Available',
    reserved: 'Reserved',
    picked_up: 'Picked up',
    withdrawn: 'Withdrawn',
  },
  claim: {
    pending: 'Waiting for owner',
    approved: 'Approved',
    declined: 'Declined',
    cancelled: 'Cancelled',
    no_show: 'No show',
    picked_up: 'Picked up',
  },
};

export function StatusChip({ type, status }: StatusChipProps) {
  const label =
    type === 'item'
      ? labels.item[status as ItemStatus]
      : labels.claim[status as ClaimStatus];

  return <span>{label}</span>;
}
