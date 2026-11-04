import type Category from './category'
import type User from './user'

export interface ItemCoverPhoto {
  url: string,
  altText: string,
}

export interface ItemPhoto extends ItemCoverPhoto {
  position: number,
}

export default interface Item {
  id: number,
  owner?: User,
  category: Category,
  title: string,
  description: string,
  condition: string,
  status: string,
  childAgeMinMonths: number,
  childAgeMaxMonths: number,
  city: string,
  state: string,
  postalCode: string,
  country: string,
  reservedAt: Date,
  pickedUpAt: Date,
  createdAt: Date,
  coverPhoto: ItemPhoto,
  photos?: ItemPhoto[],
}
