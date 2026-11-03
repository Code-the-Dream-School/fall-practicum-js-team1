import type Category from './category'
import type User from './user'

export interface ItemPhoto {
  url: string,
  altText: string,
}

export default interface Item {
  id: number,
  owner: User,
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
  latitude: number,
  longitude: number,
  reservedAt: Date,
  pickedUpAt: Date,
  createdAt: Date,
  updatedAt: Date,
  photos: ItemPhoto[],
}
