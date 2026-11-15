import type User from './user';

// what the Home page can send to GET /items
export type ItemFilters = {
  q?: string;
  category?: string;
  condition?: string;
  city?: string;
  ageMin?: number;
  ageMax?: number;
  page?: number;
  limit?: number;
};

// what the Post an item form sends to POST /items
export type NewItem = {
  title: string;
  description: string;
  category: string;
  condition: string;
  childAgeMinMonths?: number;
  childAgeMaxMonths?: number;
  addressId: string;
  instructions?: string;
  availability?: string;
  // publicId is the Cloudinary id the upload returned. The API requires it for every photo.
  photos: { url: string; publicId: string; altText?: string }[];
};

// what the address form sends to POST /addresses
export type NewAddress = {
  nickname?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

// the data of register, logon and GET /users/me
export type AuthData = { user: User; csrfToken: string };

// the data of GET /profile/stats
export type ProfileStats = {
  donations: {
    posted: number;
    waitingForYou: number;
    approved: number;
    pickedUp: number;
  };
  claims: {
    requested: number;
    waitingForOwner: number;
    approved: number;
    pickedUp: number;
  };
};

// the data of POST /uploads/signature
export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};
