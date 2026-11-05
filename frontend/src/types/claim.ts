import type Item from './item'
import type User from './user'

export default interface Claim {
  id: string,
  item: Item,
  status: string,
}

export interface ClaimIndex extends Claim {
  claimer: User,
  message: string,
  decidedAt: Date,
  pickedUpAt: Date,
  createdAt: Date,
}
