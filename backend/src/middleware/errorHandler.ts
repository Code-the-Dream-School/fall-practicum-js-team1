import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/apiError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  
  let status = 500;
  let message = 'Server error';
  
  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
  }

  res.status(status).json({
    success: false,
    message
  })
}