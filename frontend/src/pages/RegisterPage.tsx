import { useState } from 'react';
import { Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerUser } from '@/services/authApi';
import { registerField } from '@/lib/authForm';
import { useAuthStore } from '@/store/authStore';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/schemas/registerSchema';
import AuthField from '@/components/auth/AuthField';
import AuthShell from '@/components/auth/AuthShell';
import PasswordChecklist from '@/components/auth/PasswordChecklist';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const [apiError, setApiError] = useState<string | null>(null);

  const setUser = useAuthStore((state) => state.setUser);
  const setCsrfToken = useAuthStore((state) => state.setCsrfToken);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    reValidateMode: 'onBlur',
  });

  const {
    handleSubmit,
    getValues,
    trigger,
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = form;

  const password = useWatch({ control, name: 'password' }) ?? '';

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null);

    try {
      const result = await registerUser(data);

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
      title="Join Hand Me Down"
      subtitle="Free baby and toddler gear, handed down by families nearby."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Log in
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
          id="name"
          label="Full name"
          autoComplete="name"
          error={errors.name?.message}
          registration={registerField(form, 'name')}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          registration={registerField(form, 'email')}
        />

        {/* The checklist shows what is missing, so the password has no error text. */}
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={undefined}
          describedBy="password-requirements"
          registration={registerField(form, 'password', () => {
            if (getValues('confirmPassword')) {
              void trigger('confirmPassword');
            }
          })}
        >
          <PasswordChecklist
            id="password-requirements"
            password={password}
            showResults={password.length > 0 || isSubmitted}
          />
        </AuthField>

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={registerField(form, 'confirmPassword')}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-12 w-full rounded-full text-base"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
