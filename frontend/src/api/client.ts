// The only file that talks to the api.
// Every function returns the data on success and THROWS an Error on any failure
import axios from 'axios';

import { setupMock } from './mockService';
import type {
  Address,
  AuthData,
  Category,
  Claim,
  Item,
  ItemFilters,
  ItemList,
  ItemShow,
  NewAddress,
  NewItem,
  ProfileStats,
  UploadSignature,
} from '@/types';

if (import.meta.env['VITE_API_BASE_URL'] === undefined) {
  throw new Error('API url not defined');
}
const BASE_URL: string = `${import.meta.env['VITE_API_BASE_URL']}/api`;

// Global axios defaults
axios.defaults.baseURL = BASE_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true;

// The switch: true = the mock answers the calls
if (import.meta.env['VITE_USE_MOCKED_API_CALLS'] == 'true') {
  console.warn('API client is in mock mode!');
  setupMock(axios);
}

export class ApiRequestError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// Turns any failure into an ApiRequestError with a message
const toError = (error: unknown): ApiRequestError => {
  if (axios.isAxiosError(error)) {
    // the server answered with an error status
    if (error.response) {
      const { status, data } = error.response;
      return new ApiRequestError(
        data?.message ?? 'Request failed (' + status + ')',
        status,
      );
    }
    // the request was sent but nothing came back
    return new ApiRequestError('Could not reach the server. Please try again.');
  }
  return new ApiRequestError('Something went wrong');
};

// The api wraps every answer as { success, data }. Pages only need what is inside.
// This also keeps the csrf token that the auth endpoints send, and sends it
// in the X-CSRF-TOKEN header on every request after that.
const keepCsrfToken = (auth: AuthData): AuthData => {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = auth.csrfToken;
  return auth;
};

// User routes

export const registerUser = async (body: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthData> => {
  try {
    const resp = await axios.post('/users/register', body);
    return keepCsrfToken(resp.data.data);
  } catch (error) {
    throw toError(error);
  }
};

export const logonUser = async (body: {
  email: string;
  password: string;
}): Promise<AuthData> => {
  try {
    const resp = await axios.post('/users/logon', body);
    return keepCsrfToken(resp.data.data);
  } catch (error) {
    throw toError(error);
  }
};

export const logoffUser = async (): Promise<void> => {
  try {
    await axios.post('/users/logoff');
    delete axios.defaults.headers.common['X-CSRF-TOKEN'];
  } catch (error) {
    throw toError(error);
  }
};

export const getCurrentUser = async (): Promise<AuthData> => {
  try {
    const resp = await axios.get('/users/me');
    return keepCsrfToken(resp.data.data);
  } catch (error) {
    throw toError(error);
  }
};

// Categories and addresses

export const getCategories = async (): Promise<Category[]> => {
  try {
    const resp = await axios.get('/categories');
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const getAddresses = async (): Promise<Address[]> => {
  try {
    const resp = await axios.get('/addresses');
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const createAddress = async (body: NewAddress): Promise<Address> => {
  try {
    const resp = await axios.post('/addresses', body);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

// Items

export const getItems = async (
  filters: ItemFilters = {},
): Promise<ItemList> => {
  try {
    const resp = await axios.get('/items', { params: filters });
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const getItem = async (id: string): Promise<ItemShow> => {
  try {
    const resp = await axios.get('/items/' + id);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const createItem = async (body: NewItem): Promise<ItemShow> => {
  try {
    const resp = await axios.post('/items', body);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const getUploadSignature = async (): Promise<UploadSignature> => {
  try {
    const resp = await axios.post('/uploads/signature');
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

// Profile

export const getMyItems = async (): Promise<Item[]> => {
  try {
    const resp = await axios.get('/profile/items');
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const getMyClaims = async (status?: string): Promise<Claim[]> => {
  try {
    const resp = await axios.get('/profile/claims', { params: { status } });
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const getMyStats = async (): Promise<ProfileStats> => {
  try {
    const resp = await axios.get('/profile/stats');
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};
