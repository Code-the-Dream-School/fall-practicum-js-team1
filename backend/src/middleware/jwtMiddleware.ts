import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

type UserPayload = {
  id: string;
  csrfToken: string;
};

const unauthorized = (res: Response): void => {
  res.status(StatusCodes.UNAUTHORIZED).json({
    success: false,
    message: 'No user is authenticated.',
  });
};
const forbidden = (res: Response): void => {
  res.status(StatusCodes.FORBIDDEN).json({
    success: false,
    message: 'Invalid CSRF token',
  });
};

export const jwtMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.JWT_SECRET === undefined) {
    throw new Error('JWT_SECRET not defined');
  }

  const token = req?.cookies?.jwt;

  if (!token) {
    return unauthorized(res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;

    req.user = { id: decoded.id };

    if (['POST', 'PATCH', 'PUT', 'DELETE', 'CONNECT'].includes(req.method)) {
      if (req.get('X-CSRF-TOKEN') != decoded.csrfToken) {
        return forbidden(res);
      }
    }

    next();
  } catch {
    unauthorized(res);
  }
};
