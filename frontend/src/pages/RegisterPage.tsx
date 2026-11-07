import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { registerUser } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/schemas/registerSchema';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  // API error state
  const [apiError, setApiError] = useState<string | null>(null);

  // Zustand authentication store
  const setUser = useAuthStore((state) => state.setUser);
  const setCsrfToken = useAuthStore((state) => state.setCsrfToken);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  // Handle registration submission
  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null);

    try {
      const result = await registerUser(data);

      // Save authenticated user and CSRF token in Zustand.
      // GuestRoute handles the redirect.
      setCsrfToken(result.csrfToken);
      setUser(result.user);
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
      <h1 className="mb-6 text-2xl font-semibold">Create an account</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* API Error Message */}
        {apiError && (
          <Alert variant="destructive" role="alert" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Full Name */}
        <div className="mb-4">
          <Label htmlFor="name" className="mb-2">
            Full name
          </Label>

          <Input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />

          {errors.name && (
            <p
              id="name-error"
              role="alert"
              className="mt-1 text-sm text-destructive"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <Label htmlFor="email" className="mb-2">
            Email
          </Label>

          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />

          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="mt-1 text-sm text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <Label htmlFor="password" className="mb-2">
            Password
          </Label>

          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              onChange: () => {
                if (getValues('confirmPassword')) {
                  void trigger('confirmPassword');
                }
              },
            })}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? 'password-help password-error' : 'password-help'
            }
          />

          {/* Password requirements */}
          <p id="password-help" className="mt-1 text-sm text-muted-foreground">
            At least 8 characters, 1 lowercase letter, 1 capital letter, and 1
            number.
          </p>

          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="mt-1 text-sm text-destructive"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <Label htmlFor="confirmPassword" className="mb-2">
            Confirm password
          </Label>

          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? 'confirm-password-error' : undefined
            }
          />

          {errors.confirmPassword && (
            <p
              id="confirm-password-error"
              role="alert"
              className="mt-1 text-sm text-destructive"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </main>
  );
}
