import type { ComponentProps } from 'react';
import type { StatusChip } from '@/components/ui/StatusChip';

export type ClaimStatus = Extract<
  ComponentProps<typeof StatusChip>,
  { kind: 'claim' }
>['status'];

export type Pickup = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  instructions: string;
  availability: string;
};

// a claim the user made
export type ProfileClaim = {
  id: string;
  status: ClaimStatus;
  createdAt: string;
  item: {
    id: string;
    title: string;
    coverPhoto: { url: string; altText: string } | null;
  };
  pickup: Pickup | null;
};

// a request someone made
export type ItemRequest = {
  id: string;
  itemId: string;
  status: ClaimStatus;
  message: string;
  claimer: { id: string; name: string };
  createdAt: string;
};

export type Decision = 'approved' | 'declined';

// everything the owner can do from the donations list
export type DonationActions = {
  onDecision: (claimId: string, decision: Decision) => void;
  onPickedUp: (itemId: string) => void;
  onNoShow: (claimId: string) => void;
  onWithdraw: (itemId: string) => void;
  onRestore: (itemId: string) => void;
};
