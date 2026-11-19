import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    deactivatedAt: Date | null;
    csrfToken: string;
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

const getPayload = (req: Request): UserPayload | null => {
  const token = req?.cookies?.jwt;

  if (!token) {
    return null;
  }

  if (process.env.JWT_SECRET === undefined) {
    throw new Error('JWT_SECRET not defined');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.id !== 'string' ||
      typeof decoded.csrfToken !== 'string'
    ) {
      return null;
    }

    return {
      id: decoded.id,
      csrfToken: decoded.csrfToken,
    };
  } catch {
    return null;
  }
};

const loadUser = async (req: Request): Promise<boolean> => {
  const payload = getPayload(req);

  if (!payload) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      deactivatedAt: true,
    },
  });

  if (!user || user.deactivatedAt !== null) {
    return false;
  }

  req.user = {
    ...user,
    csrfToken: payload.csrfToken,
  };

  req.authCsrfToken = payload.csrfToken;

  return true;
};

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!(await loadUser(req))) {
    throw new ApiError('Please sign in', StatusCodes.UNAUTHORIZED);
  }

  next();
};

export const requireCsrf = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!['POST', 'PATCH', 'PUT', 'DELETE', 'CONNECT'].includes(req.method)) {
    next();
    return;
  }

  if (!req.authCsrfToken || req.get('X-CSRF-TOKEN') !== req.authCsrfToken) {
    throw new ApiError('Invalid CSRF token', StatusCodes.FORBIDDEN);
  }

  next();
};

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== 'admin') {
    throw new ApiError('Admin access required', StatusCodes.FORBIDDEN);
  }

  next();
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await loadUser(req);
  } catch {
    delete req.user;
    delete req.authCsrfToken;
  }

  next();
};

export const jwtMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (process.env.JWT_SECRET === undefined) {
    throw new Error('JWT_SECRET not defined');
  }

  const token = req?.cookies?.jwt;

  if (!token) {
    return unauthorized(res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        deactivatedAt: true,
      },
    });

    if (!user || user.deactivatedAt !== null) {
      return unauthorized(res);
    }

    req.user = {
      ...user,
      csrfToken: decoded.csrfToken,
    };

    req.authCsrfToken = decoded.csrfToken;

    if (['POST', 'PATCH', 'PUT', 'DELETE', 'CONNECT'].includes(req.method)) {
      if (req.get('X-CSRF-TOKEN') != decoded.csrfToken) {
        return forbidden(res);
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return unauthorized(res);
    }

    next(error);
  }
};
