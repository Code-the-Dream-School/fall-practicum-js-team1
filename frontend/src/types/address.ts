import type User from './user'

export default interface Address {
  id: number,
  user: User,
  nickname: string,
  line1: string,
  line2: string | null,
  city: string,
  state: string,
  postalCode: string,
  country: string,
  latitude: number,
  longitude: number,
  isDefault: boolean,
  createdAt: Date,
  updatedAt: Date,
}
