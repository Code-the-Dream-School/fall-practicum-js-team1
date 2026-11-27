import type Category from './category';
import type User from './user';

export interface ItemCoverPhoto {
  url: string;
  altText: string | null;
}

export interface ItemPhoto {
  id: string;
  url: string;
  altText: string;
  position: number;
}

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
  coverPhoto: ItemCoverPhoto | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ItemList {
  items: Item[];
  pagination: Pagination;
}

export interface ItemShow extends Omit<Item, 'coverPhoto'> {
  owner: Pick<User, 'id' | 'name'>;
  description: string;
  photos: ItemPhoto[];
  postalCode: string;
  createdAt: string;
}
