import type { ItemCoverPhoto } from './item';
import type User from './user';

export interface ItemClaim {
  id: string;
  itemId: string;
  status: string;
  message: string | null;
  claimer: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

export interface ClaimPickup {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  instructions: string | null;
  availability: string | null;
}

export default interface Claim {
  id: string;
  status: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    status: string;
    owner: Pick<User, 'id' | 'name'>;
    coverPhoto: ItemCoverPhoto | null;
  };
  pickup: ClaimPickup | null;
}

export interface PatchedClaim {
  id: string;
  status: string;
}

export interface CreatedClaim {
  id: string;
  itemId: string;
  status: string;
}
