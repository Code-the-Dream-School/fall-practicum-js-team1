import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import {
  mockData,
  getUser,
  getItems,
  getAddresses,
} from './mockData';
//import

export const setupMock = (axiosInstance: typeof axios) => {
  const mock = new AxiosMockAdapter(axiosInstance, { delayResponse: 300 })

  const csrfToken: string = 'mocked-placehodlder'

  // user routes
  mock.onGet('/users/me').reply(
    200,
    {
      success: true,
      data: {
        user: getUser(),
        csrfToken
      }
    }
  )
  mock.onPost('/users/register').reply(
    201,
    {
      success: true,
      {
        user: getUser(),
        csrfToken
      }
    }
  )
  mock.onPost('/users/logon').reply(
    200,
    {
      success: true,
      data: {
        user: getUser(),
        csrfToken
      }
    }
  )
  mock.onPost('/users/logoff').reply(
    200,
    {
      success: true,
      data: {
        message: 'Logged out successfully',
      }
    }
  )
  mock.onGet('/users/me').reply(
    200,
    {
      success: true,
      data: {
        user: getUsers(),
        csrfToken
      }
    }
  )

  // category routes
  mock.onGet('/categories').reply(
    200,
    {
      success: true,
      data: {
        categories: getCategories(),
      }
    }
  );

  // address routes
  mock.onGet('/addresses').reply(
    200,
    {
      success: true,
      data: {
        addresses: getAddresses(),
      }
    }
  )
  mock.onPost('/addresses').reply(
    201,
    {
      success: true,
      data: {
        address: getAddresses()[0],
      }
    }
  )

  // profile routes
  mock.onGet('/profile/items').reply(
    200,
    getItems(),
  )

  // item routes
  mock.onGet('/items').reply((config) => {
    let {
      q,
      category,
      condition,
      ageMin,
      ageMax,
      city, // Do we need state too?
      limit,
      page,
    } = config.params || {}
    limit ||= 10
    page ||= 1

    let items = getItems()

    if (q) {
      q = q.toLowerCase()
      items = items.filter((item) => item.description.toLowerCase() === q)
    }

    if (category) {
      category = category.toLowerCase()
      items = items.filter((item) => item.category.key === category)
    }

    if (condition) {
      condition = condition.toLowerCase()
      items = items.filter((item) => item.condition === condition)
    }

    if (ageMin) {
      ageMin = Number(ageMin)
      items = items.filter((item) => item.childAgeMinMonths >= ageMin)
    }

    if (ageMax) {
      ageMax = Number(ageMax)
      items = items.filter((item) => item.childAgeMaxMonths <= ageMax)
    }

    if (city) {
      city = city.toLowerCase()
      items = items.filter((item) => item.city.toLowerCase() === city)
    }

    page = Number(page)
    limit = Number(limit)
    const startIndex = (page - 1) * limit;
    items = items.slice(startIndex, startIndex + limit)
    const pages = Math.ceil(items.length / limit)

    return [
      200,
      {
        data: items,
        pagination: {
          page,
          limit,
          total: items.length,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        }
      }
    ]
  })

  // claim routes
}
