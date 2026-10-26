import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

type UserPayload = {
  id: number;
  csrfToken: string;
};

const send401 = (res: Response): void => {
  res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'No user is authenticated.' });
};

const jwtMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.JWT_SECRET === undefined) {
    throw new Error('JWT_SECRET not defined');
  }

  const token = req?.cookies?.jwt;
  if (!token) {
    return send401(res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;
    req.user = { id: decoded.id };
    if (['POST', 'PATCH', 'PUT', 'DELETE', 'CONNECT'].includes(req.method)) {
      if (req.get('X-CSRF-TOKEN') != decoded.csrfToken) {
        return send401(res);
      }
    }
    next();
  } catch (_err) {
    send401(res);
  }
};

export default jwtMiddleware;
