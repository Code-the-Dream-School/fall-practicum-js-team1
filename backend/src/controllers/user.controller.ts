import type { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../config/db.prisma.js';
import { ApiError } from '../utils/apiError.js';
import { loginSchema, registerSchema } from '../validator/user.validator.js';

const SALT_ROUNDS = 10;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const cookieFlags: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const setJwtCookie = (_req: Request, res: Response, user: { id: string }) => {
  const payload = {
    id: user.id,
    csrfToken: randomUUID(),
  };

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  const token = jwt.sign(payload, secret, {
    expiresIn: ONE_DAY_MS / 1000,
  });

  res.cookie('jwt', token, {
    ...cookieFlags,
    maxAge: ONE_DAY_MS,
  });

  return payload.csrfToken;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  // Validate the request body
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(result.error.issues[0]?.message ?? 'Invalid data', 400);
  }

  const { name, email, password } = result.data;

  // Hash the password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Save the user and handle duplicate email errors
  let user;

  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ApiError('That email is already registered', 409);
    }

    throw error;
  }

  // Sign in the newly registered user
  const csrfToken = setJwtCookie(req, res, user);

  res.status(201).json({
    success: true,
    data: {
      user,
      csrfToken,
    },
  });
};

export const logon = async (req: Request, res: Response): Promise<void> => {
  // Validate the request body
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(result.error.issues[0]?.message ?? 'Invalid data', 400);
  }

  const { email, password } = result.data;

  // Find the user
  const found = await prisma.user.findUnique({
    where: { email },
  });

  // Verify the password
  const passwordMatches = found
    ? await bcrypt.compare(password, found.passwordHash)
    : false;

  if (!found || !passwordMatches) {
    throw new ApiError('Invalid email or password', 401);
  }

  // Sign in and generate a CSRF token
  const csrfToken = setJwtCookie(req, res, found);

  // Return user information without the password hash
  const user = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role,
  };

  res.status(200).json({
    success: true,
    data: {
      user,
      csrfToken,
    },
  });
};

export const logoff = (_req: Request, res: Response): void => {
  res.clearCookie('jwt', cookieFlags);

  res.status(200).json({
    success: true,
    message: 'Logged out',
  });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError('Not authenticated', 401);
  }

  // Load the authenticated user from the database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    res.clearCookie('jwt', cookieFlags);

    throw new ApiError('Not authenticated', 401);
  }

  // Return both user information and the CSRF token
  // so the frontend can restore the session after refresh.
  res.status(200).json({
    success: true,
    data: {
      user,
      csrfToken: req.authCsrfToken,
    },
  });
};
