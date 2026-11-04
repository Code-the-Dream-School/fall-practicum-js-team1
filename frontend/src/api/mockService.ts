import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import {
  getUser,
  getItems
} from './mockData';
//import

export const setupMock = (axiosInstance: typeof axios) => {
  const mock = new AxiosMockAdapter(axiosInstance, { delayResponse: 300 })

  const csrfToken: string = 'mocked-placehodlder'

  // user routes
  mock.onGet('/users/me').reply(
    200,
    {
      user: getUser(),
      csrfToken
    }
  )
  mock.onPost('/users/register').reply(
    201,
    {
      user: getUser(),
      csrfToken
    }
  )
  mock.onPost('/users/logon').reply(
    200,
    {
      user: getUser(),
      csrfToken
    }
  )
  mock.onPost('/users/logoff').reply(
    200,
    {
      message: 'Logged out successfully',
    }
  )

  // profile routes
  mock.onGet('/profile/items').reply(
    200,
    getItems(),
  )

  // item routes
  mock.onGet('/items').reply((config) => {
    const {
      q,
      category,
      condition,
      ageMin,
      ageMax,
      city,
      page,
      limit,
    } = config.params || {}

    if (q) {
    }
  })
  // claim routes
}
