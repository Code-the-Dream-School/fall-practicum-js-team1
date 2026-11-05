import type Category from './category'
import type User from './user'

export interface ItemCoverPhoto {
  id: number,
  url: string,
  altText: string,
}

export interface ItemPhoto extends ItemCoverPhoto {
  position: number,
}

// Used in /api/items index call
export default interface Item {
  id: string,
  category: Category,
  title: string,
  condition: string,
  status: string,
  childAgeMinMonths: number,
  childAgeMaxMonths: number,
  city: string,
  state: string,
  country: string,
  reservedAt: Date,
  pickedUpAt: Date,
  coverPhoto: ItemPhoto,
}

export interface ItemShow extends Item {
  owner: User,
  description: string,
  photos: ItemPhoto[],
  postalCode: string,
  createdAt: Date,
}
