import Item from './item'
import User from './user'

export default interface Claim {
  id: number,
  item: Item,
  claimer: User,
  status: string,
  message: string,
  decidedAt: Date,
  pickedUpAt: Date,
  createdAt: Date,
}
