import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/apiError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let message = 'Server error';

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
  }

  res.status(status).json({
    success: false,
    message,
  });
};
