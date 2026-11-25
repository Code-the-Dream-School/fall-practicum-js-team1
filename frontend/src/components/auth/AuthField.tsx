import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AuthField({
  id,
  label,
  type = 'text',
  autoComplete,
  error,
  describedBy,
  registration,
  children,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete: string;
  error: string | undefined;
  describedBy?: string;
  registration: UseFormRegisterReturn;
  children?: ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className="h-11 rounded-xl px-3.5 text-base"
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${describedBy ?? ''} ${errorId}`.trim() : describedBy
        }
        {...registration}
      />

      {children}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
