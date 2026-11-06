// Answers the api calls with the fake data from mockData.ts while we are in mock mode.
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import {
  CLOUDINARY_UPLOAD_URL,
  MOCK_PASSWORD,
  addAddress,
  addItem,
  addUser,
  findItem,
  findUserByEmail,
  getAddresses,
  getAuthData,
  getCategories,
  getFakeUploadResult,
  getItems,
  getMyClaims,
  getMyItems,
  getMyStats,
  getSignedInUser,
  getUploadSignature,
  signIn,
  signOut,
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

// runs the handler for the signed in user, and answers 401 if nobody is signed in
const forSignedInUser = (
  handler: (user: User, config: AxiosRequestConfig) => [number, unknown],
) => {
  return (config: AxiosRequestConfig): [number, unknown] => {
    const user = getSignedInUser();
    if (!user) {
      return [UNAUTHORIZED, failure('Not signed in')];
    }
    return handler(user, config);
  };
};

export const setupMock = (axiosInstance: AxiosInstance) => {
  // the delay is so we can see the loading states
  const mock = new AxiosMockAdapter(axiosInstance, {
    delayResponse: MOCK_DELAY_MS,
  });

  // sign in and out

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

  // home page and item details

  mock.onGet('/categories').reply(() => {
    return [OK, success(getCategories())];
  });

  mock.onGet('/items').reply((config) => {
    return [OK, success(getItems(config.params))];
  });

  // post an item

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

  // the photo upload goes to cloudinary, not to our api
  mock.onPost(CLOUDINARY_UPLOAD_URL).reply(() => {
    return [OK, getFakeUploadResult()];
  });

  mock.onPost('/items').reply(
    forSignedInUser((user, config) => {
      const body = JSON.parse(config.data);
      return [CREATED, success(addItem(user, body))];
    }),
  );

  // profile

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

  // one item

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
