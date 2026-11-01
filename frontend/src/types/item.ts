import Category from './category'
import User from './user'
impoirt Address from './address'

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
  ageMinMonths: number,
  ageMaxMonths: number,
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
