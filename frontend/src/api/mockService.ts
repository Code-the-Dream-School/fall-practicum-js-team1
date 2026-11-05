import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import {
  mockData,
  getUser,
  getItems,
  getAddresses,
  getCategories,
  getClaims,
} from './mockData';

export const setupMock = (axiosInstance: typeof axios) => {
  const mock = new AxiosMockAdapter(axiosInstance, { delayResponse: 300 })

  const csrfToken: string = 'mocked-placehodlder'
  const itemClaimsUri = '/items/[\\w-]+/claims'
  const itemClaimsUriRegex = new RegExp(itemClaimsUri)

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
      data: {
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
  mock.onGet(/\/items\/[\w-]+/).reply(
    200,
    {
      success: true,
      data: {
        item: getItems()[0],
      }
    }
  )
  mock.onPost('/items').reply(
    201,
    {
      success: true,
      data: getItems()[0],
    }
  )

  // upload routes
  mock.onPost('/uploads/signature').reply(
    200,
    {
      success: true,
      data: {
        cloudName: "example-cloud",
        apiKey: "example-api-key",
        timestamp: 1234567890,
        folder: "hand-me-down/items",
        signature: "example-signature"
      }
    }
  )

  // claim routes
  const patchClaimCallback = (config, status) => {
    const parts = config.url.split('/')
    const id = parts[5]

    return [
      200,
      {
        success: true,
        data: {
          status,
          id,
          csrfToken,
        }
      }
    ]
  }

  mock.onPost(itemClaimsUriRegex).reply((config) => {
    const parts = config.url.split('/')
    const itemId = parts[6]

    return [
      201,
      {
        success: true,
        data: {
          claim: {
            id: 1,
            status: 'pending',
            itemId,
          }
        }
      }
    ]
  })

  mock.onGet(itemClaimsUriRegex).reply(
    200,
    {
      success: true,
      data: {
        claims: getClaims(),
      }
    }
  )

  mock.onPatch(/\/claims\/[\w-]+$/).reply((config) => {
    patchClaimCallback(config, 'approved')
  })

  mock.onPatch(/\/claims\/[\w-]+\/cancel/).reply((config) => {
    patchClaimCallback(config, 'cancelled')
  })

  mock.onPatch(/\/claims\/[\w-]+\/no-show/).reply((config) => {
    patchClaimCallback(config, 'no_show')
  })

  mock.onPatch(/\/claims\/[\w-]+\/picked-up/).reply((config) => {
    patchClaimCallback(config, 'picked_up')
  })

  // profile routes
  mock.onGet('/profile/items').reply(
    200,
    {
      success: true,
      data: {
        items: getItems(true),
      }
    }
  )

  mock.onGet('/profile/claims').reply(
    200,
    {
      success: true,
      data: {
        "id": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
        "status": "approved",
        "createdAt": "2026-10-21T10:00:00.000Z",
        "item": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "title": "Baby Stroller",
          "status": "reserved",
          "coverPhoto": {
            "url": "https://res.cloudinary.com/example/image/upload/hand-me-down/items/stroller.jpg",
            "altText": "Grey baby stroller"
          }
        },
        "pickup": {
          "line1": "123 Main Street",
          "line2": "Apt 2",
          "city": "San Rafael",
          "state": "CA",
          "postalCode": "94901",
          "instructions": "Ring the bell twice",
          "availability": "Weekdays after 5pm"
        }
      }
    }
  )

  mock.onGet('/profile/stats').reply(
    200,
    {
      success: true,
      "data": {
        "donations": {
          "posted": 5,
          "waitingForYou": 2,
          "approved": 1,
          "pickedUp": 2
        },
        "claims": {
          "requested": 3,
          "waitingForOwner": 1,
          "approved": 1,
          "pickedUp": 1
        }
      }
    }
  )

  // message routes
  const claimMessageUriRegex = new RegExp('/claims/[\\w+-]+/messages')
  mock.onPost(claimMessageUriRegex).reply(
    201,
    {
      success: true,
      data: {
        "id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
        "claimId": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
        "senderId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        "body": "Hello, is the stroller still available for pickup?",
        "readAt": null,
        "createdAt": "2026-10-21T10:05:00.000Z"
      }
    }
  )

  mock.onGet(claimMessageUriRegex).reply(
    200,
    {
      success: true,
      data: [
        {
          "id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
          "claimId": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
          "senderId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
          "body": "Hello, is the stroller still available for pickup?",
          "readAt": null,
          "createdAt": "2026-10-21T10:05:00.000Z"
        }
      ]
    }
  )

  mock.onPatch(/\/claims\/[\w-]+\/messages\/read/).reply(
    200,
    {
      success: true,
      data: { "updatedCount": 2 },
    }
  )
}
