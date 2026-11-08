import type { ItemCoverPhoto } from './item';
import type User from './user';

// One claim in GET /api/items/:id/claims
export interface ItemClaim {
  id: string;
  itemId: string;
  status: string;
  message: string;
  claimer: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

// The pickup details a claimer only gets when the claim is approved
export interface ClaimPickup {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  instructions: string;
  availability: string;
}

// One claim in GET /api/profile/claims
export default interface Claim {
  id: string;
  status: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    status: string;
    coverPhoto: ItemCoverPhoto | null;
  };
  pickup: ClaimPickup | null; // null unless the claim is approved
}

// Responses for patched claims
export interface PatchedClaim {
  id: string;
  status: string;
}
