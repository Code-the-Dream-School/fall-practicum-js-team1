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
      city, // Do we need state too?
      page,
      limit,
    } = config.params || {}

    let items = getItems()

    if (q) {
      items = items.filter((item) => item.description.toLowerCase() === q.toLowerCase())
    }

    if (category) {
      items = items.filter((item) => item.category.key === category.toLowerCase())
    }

    if (condition) {
      items = items.filter((item) => item.condition === condition.toLowerCase())
    }

    if (ageMin) {
    }

    if (ageMax) {
    }

    if (city) {
    }

    if (page) {
    }

    return [
      200,
      {
        data: items,
      }
    ]
  })
  // claim routes
}
