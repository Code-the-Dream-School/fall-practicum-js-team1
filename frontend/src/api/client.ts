import axios from 'axios'
import { type AxiosResponse } from 'axios'

import { setupMock } from './mockService'
import { type GenericResponse } from './responseTypes'

type PromisedResponse = Promise<GenericResponse>

class ApiClientError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

if (import.meta.env['VITE_API_BASE_URL'] === undefined) {
  throw new Error('API url not defined')
}
const BASE_URL: string = `${import.meta.env['VITE_API_BASE_URL']}/api`

// Global axios defaults
axios.defaults.baseURL = BASE_URL
axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.withCredentials = true

if (import.meta.env['VITE_USE_MOCKED_API_CALLS'] == 'true') {
  console.warn('API client is in mock mode!')
  setupMock(axios)
}

function handleError({ response, error }: { response?: AxiosResponse, error?: unknown }): void {
  let message;
  let status: number | undefined;

  if (axios.isAxiosError(error) && error.request) {
    // Server error
    message = 'Could not reach the server. Please try again.'
    status = error.status
  } else if (response) {
    message = response?.data?.data?.message || 'Something went wrong'
    status = response?.status
  }

  status ||= 500
  throw new ApiClientError(message, status)
}

const checkResponseFailure = (response: AxiosResponse): boolean => response.data?.success !== 'true'

// User routes
export async function registerUser({ email, name, password }: { email: string, name: string, password: string }): PromisedResponse {
  try {
    const response = await axios.post(
      '/users/register',
      { email, name, password }
    )

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    handleError({ error })
  }
}

export async function logonUser({ email, password }: { email: string, password: string }): PromisedResponse {
  try {
    const response = await axios.post(
      '/users/logon',
      { email, password }
    )

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    handleError({ error })
  }
}

export async function logoffUser(): PromisedResponse {
  try {
    const response = await axios.post('/users/logoff')

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    handleError({ error })
  }
}


export async function getCurrentUser(): PromisedResponse {
  try {
    const response = await axios.get(`/users/me`)

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    handleError({ error })
  }
}
// end User routes

// Category routes
export async function getCategories(): PromisedResponse {
  try {
    const response = await axios.get('/categories')

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    return handleError({ error })
  }
}
// end Category routes

// Address routes
export async function getAddresses(): PromisedResponse {
  try {
    const response = await axios.get('/addresses')

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    return handleError({ error })
  }
}

type CreateAddressParams = {
  nickname: string,
  line1: string,
  line2: string | null,
  city: string,
  state: string,
  postalCode: string,
  isDefault: boolean,
}
export async function createAddress({ nickname, line1, line2, city, state, postalCode, isDefault = false }: CreateAddressParams): PromisedResponse {
  try {
    const response = await axios.post('/addresses', {
      nickname,
      line1,
      line2,
      city,
      state,
      postalCode,
      isDefault,
    })

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    handleError({ error })
  }
}
// end Address routes

// Item routes
type ItemFilterParams = {
  q?: string,
  category?: string,
  condition?: string,
  childAgeMinMonths?: number,
  childAgeMaxMonths?: number,
  city?: string,
  page?: number,
  limit?: number,
}
export async function getItems({
  q,
  category,
  condition,
  childAgeMinMonths,
  childAgeMaxMonths,
  city,
  page = 1,
  limit = 12
}: ItemFilterParams): PromisedResponse {
  try {
    const response = await axios.get(
      '/categories',
      {
        params: {
          q,
          category,
          condition,
          childAgeMinMonths,
          childAgeMaxMonths,
          city,
          page,
          limit,
        }
      }
    )

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    return handleError({ error })
  }
}

export async function getItemDetails(itemId: string): PromisedResponse {
  try {
    const response = await axios.get(`/items/${itemId}`)

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    return handleError({ error })
  }
}

type CreateItemParams = {
  title: string,
  description: string,
  category: string,
  condition: string,
  childAgeMinMonths?: number,
  childAgeMaxMonths?: number,
  addressId: string,
  photos: {
    url: string,
    publicId: string,
    altText?: string,
  }[],
  instructions?: string,
  availability?: string,
}
export async function createItem({
  title,
  description,
  category,
  condition,
  childAgeMinMonths,
  childAgeMaxMonths,
  photos,
  addressId,
  instructions,
  availability,
}: CreateItemParams): PromisedResponse {
  try {
    const response = await axios.post(
      '/items',
      {
        title,
        description,
        category,
        condition,
        childAgeMinMonths,
        childAgeMaxMonths,
        photos,
        addressId,
        instructions,
        availability,
      }
    )

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    return handleError({ error })
  }
}
// end Item routes

// Profile routes
export async function getMyItems(): PromisedResponse {
  try {
    const response = await axios.get('/profile/items')

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    return handleError({ error })
  }
}
// end Profile routes

/*
export async function placeholder(): PromisedResponse {
  try {
    const response = await axios

    if (checkResponseFailure(response)) {
      handleError({ response })
      return
    }

    return response.data
  } catch (error) {
    return handleError({ error })
  }
}
*/
