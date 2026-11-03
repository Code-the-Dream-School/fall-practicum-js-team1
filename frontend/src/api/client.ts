import axios from 'axios'
import type { AxiosInstance } from 'axios'

import { setupMock } from './mockService'
import { type SuccessResponse, type ErrorResponse } from './responseTypes'

console.log("ENV:", import.meta.env)
console.log("api url:", import.meta.env['VITE_API_BASE_URL'])
if (import.meta.env['VITE_API_BASE_URL'] === undefined) {
  throw new Error('API url not defined')
}
const BASE_URL: string = `${import.meta.env['VITE_API_BASE_URL']}/api`

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

if (import.meta.env['VITE_USE_MOCKED_API_CALLS']) {
  console.log('API client is in MOCK mode')
  setupMock(axios, BASE_URL)
}

function requestErrorHandler(error: unknown): ErrorResponse {
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

export async function registerUser({ email, name, password }: { email: string, name: string, password: string }): Promise<SuccessResponse | ErrorResponse> {
  const resp = await axiosInstance.post(
    `${BASE_URL}/users/register`,
    { email, name, password }
  )

  return {
    success: true,
    data: {}
  }
}

export async function getMyItems(): Promise<SuccessResponse | ErrorResponse> {
  console.log('getProfile()')
  const resp = await axiosInstance.get(`${BASE_URL}/profile/items`).catch((error) => {
    console.log("INside catch")
    console.error(`type: ${typeof error}`)
    console.error(error)
    return requestErrorHandler(error)
  })
  console.log(`res:`, resp)
  return {
    success: true,
    data: [],
  }
}
