import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '@/schemas/loginSchema';
import { loginUser } from '@/services/authApi';
import { registerField } from '@/lib/authForm';
import { useAuthStore } from '@/store/authStore';
import AuthField from '@/components/auth/AuthField';
import AuthShell from '@/components/auth/AuthShell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [apiError, setApiError] = useState<string | null>(null);

  const setUser = useAuthStore((state) => state.setUser);
  const setCsrfToken = useAuthStore((state) => state.setCsrfToken);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    reValidateMode: 'onBlur',
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);

    try {
      const result = await loginUser(data);

      // GuestRoute redirects once the user is saved.
      setCsrfToken(result.csrfToken);
      setUser(result.user);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to request gear or pass yours on."
      footer={
        <>
          New here?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {apiError && (
          <Alert variant="destructive" role="alert" className="rounded-xl">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={registerField(form, 'email')}
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={registerField(form, 'password')}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-12 w-full rounded-full text-base"
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </AuthShell>
  );
}
