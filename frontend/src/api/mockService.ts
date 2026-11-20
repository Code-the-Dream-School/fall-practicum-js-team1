import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';

import { useAuthStore } from '@/store/authStore';
import { USE_MOCKS } from './config';
import {
  CLOUDINARY_UPLOAD_URL,
  MOCK_PASSWORD,
  MockApiError,
  addAddress,
  addClaimMessage,
  addItem,
  addUser,
  cancelClaim,
  decideClaim,
  findItem,
  findUserByEmail,
  getAddresses,
  getAuthData,
  getCategories,
  getClaimMessages,
  getFakeUploadResult,
  getItemClaims,
  getItems,
  getMyClaims,
  getMyItems,
  getMyStats,
  getSignedInUser,
  getUploadSignature,
  markClaimMessagesRead,
  markNoShow,
  markPickedUp,
  restoreItem,
  signIn,
  signOut,
  withdrawItem,
} from './mockData';
import type { User } from './mockData';

const MOCK_DELAY_MS = 300;
const OK = 200;
const CREATED = 201;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const CONFLICT = 409;

const success = (data: unknown) => {
  return { success: true, data };
};

const failure = (message: string) => {
  return { success: false, message };
};

const forSignedInUser = (
  handler: (user: User, config: AxiosRequestConfig) => [number, unknown],
) => {
  return (config: AxiosRequestConfig): [number, unknown] => {
    const user = USE_MOCKS.auth
      ? getSignedInUser()
      : useAuthStore.getState().user;

    if (!user) {
      return [UNAUTHORIZED, failure('Not signed in')];
    }

    return handler(user, config);
  };
};

const answerAction = (run: () => unknown): [number, unknown] => {
  try {
    return [OK, success(run())];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return [CONFLICT, failure(message)];
  }
};

const answerMessage = (
  run: () => unknown,
  okStatus = OK,
): [number, unknown] => {
  try {
    return [okStatus, success(run())];
  } catch (error) {
    if (error instanceof MockApiError) {
      return [error.status, failure(error.message)];
    }

    throw error;
  }
};

export const setupMock = (axiosInstance: AxiosInstance) => {
  const mock = new AxiosMockAdapter(axiosInstance, {
    delayResponse: MOCK_DELAY_MS,
  });

  // Register real routes before the mock handlers and the final GET fallback.
  if (!USE_MOCKS.auth) {
    mock.onAny(/^\/users\/(register|logon|logoff|me)$/).passThrough();
  }

  if (!USE_MOCKS.items) {
    mock.onAny(/^\/items(?:\/[^/]+)?$/).passThrough();
    mock.onAny(/^\/items\/[^/]+\/(withdraw|restore)$/).passThrough();
    mock.onGet(/^\/categories$/).passThrough();
    mock.onAny(/^\/addresses$/).passThrough();
    mock.onPost(/^\/uploads\/signature$/).passThrough();
    mock
      .onPost(/^https:\/\/api\.cloudinary\.com\/v1_1\/[^/]+\/image\/upload$/)
      .passThrough();
  }

  if (!USE_MOCKS.profile) {
    mock.onGet(/^\/profile\/(items|claims|stats)$/).passThrough();
  }

  if (!USE_MOCKS.claims) {
    mock.onAny(/^\/items\/[^/]+\/(claims|picked-up)$/).passThrough();
    mock.onAny(/^\/claims\/[^/]+(?:\/(cancel|no-show))?$/).passThrough();
  }

  if (!USE_MOCKS.messages) {
    mock.onAny(/^\/claims\/[^/]+\/messages(?:\/read)?$/).passThrough();
  }

  // Authentication
  mock.onPost('/users/register').reply((config) => {
    const body = JSON.parse(config.data);

    if (findUserByEmail(body.email)) {
      return [CONFLICT, failure('That email is already registered')];
    }

    const user = addUser(body.name, body.email);
    signIn(user);
    return [CREATED, success(getAuthData(user))];
  });

  mock.onPost('/users/logon').reply((config) => {
    const body = JSON.parse(config.data);
    const user = findUserByEmail(body.email);

    if (!user || body.password !== MOCK_PASSWORD) {
      return [UNAUTHORIZED, failure('Incorrect email or password')];
    }

    signIn(user);
    return [OK, success(getAuthData(user))];
  });

  mock.onPost('/users/logoff').reply(() => {
    signOut();
    return [OK, success({ message: 'Logged out successfully' })];
  });

  mock.onGet('/users/me').reply(
    forSignedInUser((user) => {
      return [OK, success(getAuthData(user))];
    }),
  );

  // Home page and item details
  mock.onGet('/categories').reply(() => {
    return [OK, success(getCategories())];
  });

  mock.onGet('/items').reply((config) => {
    return [OK, success(getItems(config.params))];
  });

  // Post an item
  mock.onGet('/addresses').reply(
    forSignedInUser((user) => {
      return [OK, success(getAddresses(user))];
    }),
  );

  mock.onPost('/addresses').reply(
    forSignedInUser((user, config) => {
      const body = JSON.parse(config.data);
      return [CREATED, success(addAddress(user, body))];
    }),
  );

  mock.onPost('/uploads/signature').reply(
    forSignedInUser(() => {
      return [OK, success(getUploadSignature())];
    }),
  );

  mock.onPost(CLOUDINARY_UPLOAD_URL).reply(() => {
    return [OK, getFakeUploadResult()];
  });

  mock.onPost('/items').reply(
    forSignedInUser((user, config) => {
      const body = JSON.parse(config.data);
      return [CREATED, success(addItem(user, body))];
    }),
  );

  // Profile
  mock.onGet('/profile/items').reply(
    forSignedInUser((user) => {
      return [OK, success(getMyItems(user))];
    }),
  );

  mock.onGet('/profile/claims').reply(
    forSignedInUser((user, config) => {
      return [OK, success(getMyClaims(user, config.params?.status))];
    }),
  );

  mock.onGet('/profile/stats').reply(
    forSignedInUser((user) => {
      return [OK, success(getMyStats(user))];
    }),
  );

  // Claims and item actions
  mock.onGet(/\/items\/[^/]+\/claims$/).reply(
    forSignedInUser((_user, config) => {
      const itemId = (config.url || '').split('/')[2] ?? '';
      return [OK, success(getItemClaims(itemId))];
    }),
  );

  mock.onPatch(/\/claims\/[^/]+\/cancel$/).reply(
    forSignedInUser((_user, config) => {
      const claimId = (config.url || '').split('/')[2] ?? '';
      return answerAction(() => cancelClaim(claimId));
    }),
  );

  mock.onPatch(/\/claims\/[^/]+\/no-show$/).reply(
    forSignedInUser((_user, config) => {
      const claimId = (config.url || '').split('/')[2] ?? '';
      return answerAction(() => markNoShow(claimId));
    }),
  );

  mock.onPatch(/\/claims\/[^/]+$/).reply(
    forSignedInUser((_user, config) => {
      const claimId = (config.url || '').split('/')[2] ?? '';
      const body = JSON.parse(config.data);
      return answerAction(() => decideClaim(claimId, body.status));
    }),
  );

  mock.onPatch(/\/items\/[^/]+\/picked-up$/).reply(
    forSignedInUser((_user, config) => {
      const itemId = (config.url || '').split('/')[2] ?? '';
      return answerAction(() => markPickedUp(itemId));
    }),
  );

  mock.onPatch(/\/items\/[^/]+\/withdraw$/).reply(
    forSignedInUser((_user, config) => {
      const itemId = (config.url || '').split('/')[2] ?? '';
      return answerAction(() => withdrawItem(itemId));
    }),
  );

  mock.onPatch(/\/items\/[^/]+\/restore$/).reply(
    forSignedInUser((_user, config) => {
      const itemId = (config.url || '').split('/')[2] ?? '';
      return answerAction(() => restoreItem(itemId));
    }),
  );

  // Messages
  mock.onGet(/\/claims\/[^/]+\/messages$/).reply(
    forSignedInUser((user, config) => {
      const claimId = (config.url || '').split('/')[2] ?? '';
      return answerMessage(() => getClaimMessages(user, claimId));
    }),
  );

  mock.onPost(/\/claims\/[^/]+\/messages$/).reply(
    forSignedInUser((user, config) => {
      const claimId = (config.url || '').split('/')[2] ?? '';
      const body = JSON.parse(config.data);
      return answerMessage(
        () => addClaimMessage(user, claimId, body.body),
        CREATED,
      );
    }),
  );

  mock.onPatch(/\/claims\/[^/]+\/messages\/read$/).reply(
    forSignedInUser((user, config) => {
      const claimId = (config.url || '').split('/')[2] ?? '';
      return answerMessage(() => markClaimMessagesRead(user, claimId));
    }),
  );

  // Keep this last so the more specific GET routes match first.
  mock.onGet().reply((config) => {
    const url = config.url || '';

    if (!url.startsWith('/items/')) {
      return [NOT_FOUND, failure('No mock for GET ' + url)];
    }

    const item = findItem(url.replace('/items/', ''));
    if (!item) {
      return [NOT_FOUND, failure('Item not found')];
    }

    return [OK, success(item)];
  });
};