import axios from 'axios'
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
}
interface ErrorResponse extends BaseResponse {
  message: string,
}

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

export function test(): string {
  return ''
}
