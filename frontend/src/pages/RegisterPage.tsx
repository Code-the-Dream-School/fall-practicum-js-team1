
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';

import { registerUser } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/schemas/registerSchema';

export default function RegisterPage() {
  // API error state
  const [apiError, setApiError] = useState<string | null>(null);

  // Zustand authentication store
  const setUser = useAuthStore((state) => state.setUser);
  const setCsrfToken = useAuthStore((state) => state.setCsrfToken);

  // React Router navigation
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the originally requested page or Home
  const from = location.state?.from?.pathname || '/';

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  // Handle registration submission
  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null);

    try {
      const result = await registerUser(data);

      // Save authenticated user and CSRF token in Zustand
      setUser(result.user);
      setCsrfToken(result.csrfToken);

      // Redirect after successful registration
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
        Create an account
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

        {/* Full Name */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="mb-2 block font-medium"
          >
            Full name
          </label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={
              errors.name ? 'name-error' : undefined
            }
            className="w-full rounded-md border px-3 py-2"
          />

          {errors.name && (
            <p
              id="name-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
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

        {/* Password */}
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
            autoComplete="new-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password
                ? 'password-help password-error'
                : 'password-help'
            }
            className="w-full rounded-md border px-3 py-2"
          />

          {/* Password requirements */}
          <p
            id="password-help"
            className="mt-1 text-sm text-gray-500"
          >
            At least 8 characters, 1 lowercase letter,
            1 capital letter, and 1 number.
          </p>

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

        {/* Confirm Password */}
        <div className="mb-4">
          <label
            htmlFor="confirmPassword"
            className="mb-2 block font-medium"
          >
            Confirm password
          </label>

          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword
                ? 'confirm-password-error'
                : undefined
            }
            className="w-full rounded-md border px-3 py-2"
          />

          {errors.confirmPassword && (
            <p
              id="confirm-password-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </main>
  );
}
