import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  children?: ReactNode;
};

export default function AuthField({
  id,
  label,
  error,
  children,
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        className="h-11 rounded-xl px-3.5 text-base"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />

      {children}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
