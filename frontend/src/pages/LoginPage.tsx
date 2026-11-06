import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { loginSchema, type LoginFormValues } from '@/schemas/loginSchema';
import { loginUser } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [apiError, setApiError] = useState<string | null>(null);

  // Zustand authentication store
  const setUser = useAuthStore((state) => state.setUser);
  const setCsrfToken = useAuthStore((state) => state.setCsrfToken);

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

      // Save authentication information in Zustand.
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
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* API Error Message */}
        {apiError && (
          <Alert variant="destructive" role="alert" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
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

        {/* Password Field */}
        <div className="mb-4">
          <Label htmlFor="password" className="mb-2">
            Password
          </Label>

          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />

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

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </main>
  );
}
