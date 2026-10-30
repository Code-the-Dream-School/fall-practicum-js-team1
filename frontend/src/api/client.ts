import axios from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios'

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

const mockClient = new AxiosMockAdapter(axiosInstance)
const client = process.env['REACT_APP_USE_MOCKED_API_CALLS'] ? axiosInstance : mockClient

export function test(): string {
  return ''
}
