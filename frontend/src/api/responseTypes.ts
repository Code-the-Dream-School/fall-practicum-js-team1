export interface BaseResponse {
  success: boolean,
}
export interface SuccessResponse extends BaseResponse {
  data: unknown,
  csrfToken?: string,
}
export interface ErrorResponse extends BaseResponse {
  message: string,
}
