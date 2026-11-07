import type { RegisterFormValues } from '@/schemas/registerSchema';
import type { LoginFormValues } from '@/schemas/loginSchema';
import type { AuthUser } from '@/store/authStore';

// Authentication result
export type AuthResponse = {
  user: AuthUser;
  csrfToken: string;
};

// Registration
export async function registerUser(
  data: RegisterFormValues,
): Promise<AuthResponse> {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
    }),
  });

  if (response.status === 409) {
    throw new Error('That email is already registered');
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return parseAuthResponse(await response.json());
}

// Login
export async function loginUser(data: LoginFormValues): Promise<AuthResponse> {
  const response = await fetch('/api/users/logon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (response.status === 401) {
    throw new Error('Incorrect email or password');
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return parseAuthResponse(await response.json());
}

// Logout
export async function logoutUser(csrfToken: string): Promise<void> {
  const response = await fetch('/api/users/logoff', {
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrfToken,
    },
    credentials: 'include',
  });

  // A 401 means the session has already expired.
  // Treat it as a successful logout.
  if (!response.ok && response.status !== 401) {
    throw new Error(await getErrorMessage(response));
  }
}

// Check current session
export async function getCurrentUser(): Promise<AuthResponse | null> {
  const response = await fetch('/api/users/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return parseAuthResponse(await response.json());
}

// Extract an API error message
async function getErrorMessage(response: Response): Promise<string> {
  try {
    const result = await response.json();

    return (
      result.message ||
      result.error ||
      'Something went wrong. Please try again.'
    );
  } catch {
    return 'Something went wrong. Please try again.';
  }
}

// Validate the authentication response
function parseAuthResponse(result: unknown): AuthResponse {
  const data =
    typeof result === 'object' && result !== null && 'data' in result
      ? result.data
      : null;

  if (
    typeof data !== 'object' ||
    data === null ||
    !('user' in data) ||
    !('csrfToken' in data)
  ) {
    throw new Error('Invalid authentication response');
  }

  return data as AuthResponse;
}
