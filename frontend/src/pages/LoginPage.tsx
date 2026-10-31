
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';

import { loginSchema, type LoginFormValues } from '@/schemas/loginSchema';
import { loginUser } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [apiError, setApiError] = useState<string | null>(null);

  // Zustand authentication store
  const setUser = useAuthStore((state) => state.setUser);
  const setCsrfToken = useAuthStore((state) => state.setCsrfToken);

  // React Router navigation
  const navigate = useNavigate();
  const location = useLocation();

  // Return to the originally requested page, or Home
  const from = location.state?.from?.pathname || '/';

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  // Handle login submission
  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);

    try {
      const result = await loginUser(data);

      // Save authentication information in Zustand
      setUser(result.user);
      setCsrfToken(result.csrfToken);

      // Redirect after successful login
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">
        Log in
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* API Error Message */}
        {apiError && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {apiError}
          </p>
        )}

        {/* Email Field */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-2 block font-medium"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={
              errors.email ? 'email-error' : undefined
            }
            className="w-full rounded-md border px-3 py-2"
          />

          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <label
            htmlFor="password"
            className="mb-2 block font-medium"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? 'password-error' : undefined
            }
            className="w-full rounded-md border px-3 py-2"
          />

          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
