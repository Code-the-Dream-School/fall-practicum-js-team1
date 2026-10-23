import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps an async controller so any error it throws is passed to next() and reaches errorHandler
// Ex: router.get('/', asyncHandler(getItems));
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
