import type { RequestHandler } from 'express';
import { ApiError } from '../utils/apiError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(`Route not found: ${req.originalUrl}`, 404));
}