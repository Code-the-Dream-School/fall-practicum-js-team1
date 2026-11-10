import type Category from './category';
import type User from './user';

// The small photo the list sends
export interface ItemCoverPhoto {
  url: string;
  altText: string;
}

// A photo on the details page
export interface ItemPhoto {
  id: string;
  url: string;
  altText: string;
  position: number;
}

// One item in GET /api/items and GET /api/profile/items
export default interface Item {
  id: string;
  category: Pick<Category, 'key' | 'name'>;
  title: string;
  condition: string;
  status: string;
  childAgeMinMonths: number | null;
  childAgeMaxMonths: number | null;
  city: string;
  state: string;
  coverPhoto: ItemCoverPhoto | null; // null when the item has no photo
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// The whole data of GET /api/items
export interface ItemList {
  items: Item[];
  pagination: Pagination;
}

// GET /api/items/:id
export interface ItemShow extends Omit<Item, 'coverPhoto'> {
  owner: Pick<User, 'id' | 'name'>;
  description: string;
  photos: ItemPhoto[];
  postalCode: string;
  createdAt: string;
}
