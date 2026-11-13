// The only file that talks to the api.
// Every function returns data on success and throws an Error on failure.
import axios from 'axios';

import { setupMock } from './mockService';
import type {
  Address,
  AuthData,
  Category,
  Claim,
  CreatedClaim,
  Item,
  ItemClaim,
  ItemFilters,
  ItemList,
  ItemShow,
  NewAddress,
  NewItem,
  PatchedClaim,
  ProfileStats,
  UploadSignature,
  Message,
  ReadMessage,
} from '@/types';

if (import.meta.env['VITE_API_BASE_URL'] === undefined) {
  throw new Error('API url not defined');
}

const BASE_URL: string = `${import.meta.env['VITE_API_BASE_URL']}/api`;

// Global axios defaults
axios.defaults.baseURL = BASE_URL;
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true;

// The switch: true = the mock answers the calls.
if (import.meta.env['VITE_USE_MOCKED_API_CALLS'] === 'true') {
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

// Turns any failure into an ApiRequestError with a message.
const toError = (error: unknown): ApiRequestError => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const { status, data } = error.response;
      return new ApiRequestError(
        data?.message ?? 'Request failed (' + status + ')',
        status,
      );
    }

    return new ApiRequestError('Could not reach the server. Please try again.');
  }

  return new ApiRequestError('Something went wrong');
};

// Keep the CSRF token returned by the authentication endpoints.
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

// end Categories and addresses

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

// end Items

// Upload routes

export const getUploadSignature = async (): Promise<UploadSignature> => {
  try {
    const response = await axios.post('/uploads/signature');
    return response.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const uploadPhoto = async (
  file: File,
): Promise<{ url: string; publicId: string }> => {
  const signature = await getUploadSignature();

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('folder', signature.folder);
  form.append('signature', signature.signature);

  // Send signed format restrictions unchanged when provided.
  if (
    'allowedFormats' in signature &&
    typeof signature.allowedFormats === 'string'
  ) {
    form.append('allowed_formats', signature.allowedFormats);
  }

  // Cloudinary must not inherit our API cookies, CSRF token, or JSON headers.
  const uploader = axios.create({
    baseURL: '',
    withCredentials: false,
  });

  uploader.defaults.headers.common = {
    Accept: 'application/json',
  };
  uploader.defaults.headers.post = {};

  if (import.meta.env['VITE_USE_MOCKED_API_CALLS'] === 'true') {
    setupMock(uploader);
  }

  try {
    const response = await uploader.post<{
      secure_url?: unknown;
      public_id?: unknown;
    }>(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      form,
    );

    const { secure_url: url, public_id: publicId } = response.data;

    if (
      typeof url !== 'string' ||
      !url.startsWith('https://') ||
      typeof publicId !== 'string' ||
      !publicId.trim()
    ) {
      throw new ApiRequestError(
        'The photo upload returned an invalid response.',
      );
    }

    return { url, publicId };
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw toError(error);
  }
};

// end Upload routes

// Claim routes

type CreateClaimParams = {
  itemId: string;
  message?: string;
};

export async function createClaim({
  itemId,
  message,
}: CreateClaimParams): Promise<CreatedClaim> {
  interface ClaimPayload {
    [key: string]: string;
  }

  const payload: ClaimPayload = {};

  if (message !== undefined && message !== '') {
    payload['message'] = message;
  }

  try {
    const response = await axios.post(`/items/${itemId}/claims`, payload);
    return response.data.data;
  } catch (error) {
    throw toError(error);
  }
}

type ItemClaimParams = {
  itemId: string;
  status?: string;
};

export async function getItemClaims({
  itemId,
  status,
}: ItemClaimParams): Promise<ItemClaim[]> {
  interface GetItemClaimsPayload {
    params: {
      [key: string]: string;
    };
  }

  let payload: Partial<GetItemClaimsPayload> = {};

  if (status) {
    payload = { params: { status } };
  }

  try {
    const response = await axios.get(`/items/${itemId}/claims`, payload);
    return response.data.data;
  } catch (error) {
    throw toError(error);
  }
}

type UpdateClaimParams = {
  claimId: string;
  status: string;
};

export const updateClaim = async ({
  claimId,
  status,
}: UpdateClaimParams): Promise<PatchedClaim> => {
  try {
    const resp = await axios.patch(`/claims/${claimId}`, { status });
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

type PatchClaimParams = {
  claimId: string;
};

export const cancelClaim = async ({
  claimId,
}: PatchClaimParams): Promise<PatchedClaim> => {
  try {
    const resp = await axios.patch(`/claims/${claimId}/cancel`);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const updateClaimNoShow = async ({
  claimId,
}: PatchClaimParams): Promise<PatchedClaim> => {
  try {
    const resp = await axios.patch(`/claims/${claimId}/no-show`);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

type PickedUpParams = {
  itemId: string;
};

export const updateClaimPickedUp = async ({
  itemId,
}: PickedUpParams): Promise<PatchedClaim> => {
  try {
    const resp = await axios.patch(`/items/${itemId}/picked-up`);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

type ItemIdParams = {
  itemId: string;
};

export const withdrawItem = async ({
  itemId,
}: ItemIdParams): Promise<PatchedClaim> => {
  try {
    const resp = await axios.patch(`/items/${itemId}/withdraw`);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const restoreItem = async ({
  itemId,
}: ItemIdParams): Promise<PatchedClaim> => {
  try {
    const resp = await axios.patch(`/items/${itemId}/restore`);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

// end Claim

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

// end Profile

// Messages

export const sendMessage = async ({
  claimId,
  body,
}: {
  claimId: string;
  body: string;
}): Promise<Message> => {
  try {
    const resp = await axios.post(`/claims/${claimId}/messages`, { body });
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

type GetMessageParams = {
  claimId: string;
};

export const getMessages = async ({
  claimId,
}: GetMessageParams): Promise<Message[]> => {
  try {
    const resp = await axios.get(`/claims/${claimId}/messages`);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

export const readMessage = async ({
  claimId,
}: GetMessageParams): Promise<ReadMessage> => {
  try {
    const resp = await axios.patch(`/claims/${claimId}/messages/read`);
    return resp.data.data;
  } catch (error) {
    throw toError(error);
  }
};

// end Messages
