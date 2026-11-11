// The login code calls these functions. They go through the api client, so the
// mock switch (VITE_USE_MOCKED_API_CALLS) reaches login too.
import {
  ApiRequestError,
  getCurrentUser as getCurrentUserFromApi,
  logoffUser,
  logonUser,
  registerUser as registerUserInApi,
} from '@/api/client';
import type { AuthData } from '@/types';
import type { RegisterFormValues } from '@/schemas/registerSchema';
import type { LoginFormValues } from '@/schemas/loginSchema';

const CONFLICT = 409;
const UNAUTHORIZED = 401;

// Authentication result
export type AuthResponse = AuthData;

const hasStatus = (error: unknown, status: number): boolean => {
  return error instanceof ApiRequestError && error.status === status;
};

// Registration
export const registerUser = async (
  data: RegisterFormValues,
): Promise<AuthResponse> => {
  try {
    return await registerUserInApi({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  } catch (error) {
    if (hasStatus(error, CONFLICT)) {
      throw new Error('That email is already registered');
    }
    throw error;
  }
};

// Login
export const loginUser = async (
  data: LoginFormValues,
): Promise<AuthResponse> => {
  try {
    return await logonUser(data);
  } catch (error) {
    if (hasStatus(error, UNAUTHORIZED)) {
      throw new Error('Incorrect email or password');
    }
    throw error;
  }
};

// Logout, The client already sends the csrf token it kept at login, so none is passed in.
export const logoutUser = async (): Promise<void> => {
  try {
    await logoffUser();
  } catch (error) {
    // A 401 means the session has already expired. Treat it as a successful logout.
    if (!hasStatus(error, UNAUTHORIZED)) {
      throw error;
    }
  }
};

// Check current session, the user, or null when nobody is signed in
export const getCurrentUser = async (): Promise<AuthResponse | null> => {
  try {
    return await getCurrentUserFromApi();
  } catch (error) {
    if (hasStatus(error, UNAUTHORIZED)) {
      return null;
    }
    throw error;
  }
};
