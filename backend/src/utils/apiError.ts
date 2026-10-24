// An error that carries an HTTP status code
// Ex: throw new ApiError('Item not found', 404);
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
