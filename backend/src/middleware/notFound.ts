import type { RequestHandler } from 'express';
import { ApiError } from '../utils/apiError.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(`Route not found: ${req.originalUrl}`, 404));
};
