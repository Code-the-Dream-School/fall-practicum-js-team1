export interface UserInterface {
  id: number,
  name: string,
  email: string,
  role: string,
  avatarUrl: string | null,
}

export interface AddressInterface { 
  id: number,
  userId: number,
  nickname: string,
  line1: string,
  line2: string,
  city: string,
  state: string,
  postalCode: string,
  country: string,
  latitude: number,
  longitude: number,
  isDefault: boolean,
}

export interface Category {
  id: number,
  name: string,
}

export interface ClaimInterface {
  id: number,
  itemId: number,
  claimerId: number,
  status: string,
  message: string,
  decidedAt: Date,
  pickedUpAt: Date,
  createdAt: Date,

}
