import axios from 'axios'
import type { AxiosInstance } from 'axios'

import { setupMock } from './mockService'
import { type SuccessResponse, type ErrorResponse } from './responseTypes'

if (import.meta.env['VITE_API_BASE_URL'] === undefined) {
  throw new Error('API url not defined')
}
const BASE_URL: string = `${import.meta.env['VITE_API_BASE_URL']}/api`

axios.defaults.baseURL = BASE_URL
axios.defaults.headers.post['Content-Type'] = 'application/json'

if (import.meta.env['VITE_USE_MOCKED_API_CALLS'] == 'true') {
  console.warn('API client is in mock mode!')
  setupMock(axios)
}

function handleError(error: unknown): ErrorResponse {
  let message;
  if (error.response) {
    console.log('response error')
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
    message = 'placeholder request error'
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log('request errr')
    message = 'Could not reach the server. Please try again.'
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("other error", error.message);
    message = 'placeholder generic error'
  }

  return {
    success: false,
    message,
  }
}

// User routes
export async function registerUser({ email, name, password }: { email: string, name: string, password: string }): Promise<SuccessResponse | ErrorResponse> {
  try {
    const resp = await axios.post(
      '/users/register',
      { email, name, password }
    )

    return {
      success: true,
      data: resp.data,
    }
  } catch (error) {
    return handleError(error)
  }
}

export async function logonUser({ email, name, password }: { email: string, name: string, password: string }): Promise<SuccessResponse | ErrorResponse> {
}

export async function logoffUser(): Promise<SuccessResponse | ErrorResponse> {
}
// end User routes

export async function getMyItems(): Promise<SuccessResponse | ErrorResponse> {
  const profileItemsUrl = '/profile/items'
  try {
    const resp = await axios.get(profileItemsUrl)
    return {
      success: true,
      data: resp.data,
    }
  } catch (error) {
    return handleError(error)
  }
}
