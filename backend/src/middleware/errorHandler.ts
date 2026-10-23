import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/apiError.js';

// The one place that turns every error into a JSON response
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // Full error stays in the server log only
  console.error(err);

  // If a response was already started, let Express close the connection
  if (res.headersSent) {
    return next(err);
  }

  // Unexpected errors get a generic message, so details never leak
  let status = 500;
  let message = 'Server error';

  // An ApiError was thrown on purpose
  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
  }

  res.status(status).json({
    success: false,
    message,
  });
};
