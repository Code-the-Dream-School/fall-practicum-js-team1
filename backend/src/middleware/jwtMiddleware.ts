
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { RequestHandler } from 'express';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';

type AuthPayload = JwtPayload & {
  id: string;
  csrfToken: string;
};

const SIGN_IN_MESSAGE = 'Please sign in';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  return secret;
}

function verifyToken(token: string): AuthPayload {
  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(SIGN_IN_MESSAGE, 401);
    }

    throw error;
  }

  if (
    typeof decoded === 'string' ||
    typeof decoded.id !== 'string' ||
    typeof decoded.csrfToken !== 'string' ||
    !decoded.id ||
    !decoded.csrfToken
  ) {
    throw new ApiError(SIGN_IN_MESSAGE, 401);
  }

  return decoded as AuthPayload;
}

async function loadAuthenticatedUser(req: Parameters<RequestHandler>[0]) {
  const token = req.cookies?.jwt;

  if (typeof token !== 'string' || !token) {
    throw new ApiError(SIGN_IN_MESSAGE, 401);
  }

  const payload = verifyToken(token);

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
    throw new ApiError(SIGN_IN_MESSAGE, 401);
  }

  req.user = user;
  req.authCsrfToken = payload.csrfToken;
}

// 1. Require a signed-in, active user.
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    await loadAuthenticatedUser(req);
    next();
  } catch (error) {
    next(error);
  }
};

// 2. Protect requests that change data.
export const requireCsrf: RequestHandler = (req, _res, next) => {
  const protectedMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];

  if (!protectedMethods.includes(req.method)) {
    return next();
  }

  if (!req.user || !req.authCsrfToken) {
    return next(new ApiError(SIGN_IN_MESSAGE, 401));
  }

  const headerToken = req.get('X-CSRF-TOKEN');

  if (!headerToken || headerToken !== req.authCsrfToken) {
    return next(new ApiError('Invalid CSRF token', 403));
  }

  next();
};

// 3. Restrict access to administrators.
export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    return next(new ApiError(SIGN_IN_MESSAGE, 401));
  }

  if (req.user.role !== 'admin') {
    return next(new ApiError('Admin access required', 403));
  }

  next();
};

// 4. Identify a user on public routes without blocking access.
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    await loadAuthenticatedUser(req);
  } catch {
    delete req.user;
    delete req.authCsrfToken;
  }

  next();
};

// Backward compatibility with existing routes.
export const jwtMiddleware = requireAuth;
