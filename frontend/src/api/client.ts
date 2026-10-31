import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { setupMock } from './mockService'

if (process.env['REACT_APP_API_BASE_URL'] === undefined) {
  throw new Error('API url not defined')
}
const BASE_URL: string = `${process.env['REACT_APP_API_BASE_URL']}/api`

interface BaseResponse {
  success: boolean,
}
interface SuccessResponse extends BaseResponse {
  data: any,
  csrfToken?: string,
}
interface ErrorResponse extends BaseResponse {
  message: string,
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

if (process.env['REACT_APP_USE_MOCKED_API_CALLS'])
  setupMock(axiosInstance)


export function test(): string {
  return ''
}
