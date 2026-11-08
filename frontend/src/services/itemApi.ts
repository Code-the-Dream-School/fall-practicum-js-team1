import { getCurrentUser } from './authApi';

export type Category = {
  id: string;
  key: string;
  name: string;
};

export type Address = {
  id: string;
  nickname: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export type NewAddress = {
  nickname?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
};

export type ItemPhoto = {
  url: string;
  altText: string;
};

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
  photos: ItemPhoto[];
};

type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

const useMocks = import.meta.env['VITE_USE_MOCKED_API_CALLS'] === 'true';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
  });

  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please log in before continuing.');
    }

    const message =
      isRecord(result) && typeof result['message'] === 'string'
        ? result['message']
        : 'The request failed. Please try again.';

    throw new Error(message);
  }

  if (!isRecord(result) || result['success'] !== true || !('data' in result)) {
    throw new Error('The server returned an unexpected response.');
  }

  return result['data'] as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const session = await getCurrentUser();

  if (!session) {
    throw new Error('Please log in before continuing.');
  }

  return request<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': session.csrfToken,
    },
    body: JSON.stringify(body),
  });
}

export async function getCategories(): Promise<Category[]> {
  const result = await request<Category[]>('/categories');

  if (!Array.isArray(result)) {
    throw new Error('Could not read the categories.');
  }

  return result;
}

export async function getAddresses(): Promise<Address[]> {
  const result = await request<Address[]>('/addresses');

  if (!Array.isArray(result)) {
    throw new Error('Could not read the saved addresses.');
  }

  return result;
}

export async function createAddress(address: NewAddress): Promise<Address> {
  const result = await post<Address>('/addresses', address);

  if (!result || typeof result.id !== 'string') {
    throw new Error('Could not read the saved address.');
  }

  return result;
}

export async function createItem(item: NewItem): Promise<{ id: string }> {
  const result = await post<{ id: string }>('/items', item);

  if (!result || typeof result.id !== 'string' || !result.id) {
    throw new Error('The server did not return an item ID.');
  }

  return result;
}

export async function uploadPhoto(file: File): Promise<string> {
  const signature = await post<UploadSignature>('/uploads/signature', {});

  if (
    !signature ||
    !signature.cloudName ||
    !signature.apiKey ||
    !signature.signature ||
    !Number.isFinite(signature.timestamp)
  ) {
    throw new Error('Could not prepare the photo upload.');
  }

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/` +
    `${encodeURIComponent(signature.cloudName)}/image/upload`;

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);

  let result: unknown;

  if (useMocks) {
    // The team's fetch bridge handles /api requests only.
    // Cloudinary mock requests must use its Axios adapter.
    const [{ default: axios }, { setupMock }] = await Promise.all([
      import('axios'),
      import('../api/mockService'),
    ]);

    const uploader = axios.create();
    setupMock(uploader);

    const response = await uploader.post(uploadUrl, form);
    result = response.data;
  } else {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: form,
    });

    result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`Could not upload ${file.name}. Please try again.`);
    }
  }

  if (
    !isRecord(result) ||
    typeof result['secure_url'] !== 'string' ||
    !result['secure_url'].startsWith('https://')
  ) {
    throw new Error(`The upload for ${file.name} returned no photo URL.`);
  }

  return result['secure_url'];
}
