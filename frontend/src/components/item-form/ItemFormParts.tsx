import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ages, conditions, tints } from '@/lib/itemForm';

const COUNTER_SHOWN_FROM = 0.8;

export function ErrorText({
  id,
  message,
}: {
  id: string;
  message: string | undefined;
}) {
  return message ? (
    <p id={id} role="alert" className="text-sm text-red-600">
      {message}
    </p>
  ) : null;
}

export function CharCount({ value, max }: { value: string; max: number }) {
  if (value.length < max * COUNTER_SHOWN_FROM) return null;

  return (
    <p
      className={cn(
        'text-right text-xs text-muted-foreground',
        value.length >= max && 'font-medium text-red-600',
      )}
    >
      {value.length}/{max}
    </p>
  );
}

export function FormSection({
  id,
  title,
  hint,
  icon: Icon,
  tint,
  children,
}: {
  id?: string;
  title: string;
  hint?: string;
  icon: LucideIcon;
  tint: (typeof tints)[keyof typeof tints];
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-3xl bg-card ring-1 ring-border"
    >
      <header
        className={cn('flex items-center gap-3 px-5 py-4 sm:px-6', tint.soft)}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm',
            tint.solid,
          )}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <h2 className="text-xl leading-tight font-semibold">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      </header>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function ConditionPicker({
  value,
  error,
  onChange,
}: {
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="min-w-0 space-y-2" aria-describedby="condition-error">
      <legend className="mb-2 text-sm leading-none font-medium">
        Condition *
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {conditions.map((item, index) => (
          <label key={item.value} className="cursor-pointer">
            <input
              type="radio"
              name="condition"
              id={index === 0 ? 'condition' : undefined}
              value={item.value}
              checked={value === item.value}
              onChange={() => onChange(item.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'block rounded-xl p-3 ring-1 ring-border transition-colors hover:bg-muted peer-checked:bg-accent-blue/15 peer-checked:ring-2 peer-checked:ring-accent-blue peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
                error && 'ring-red-400',
              )}
            >
              <span className="block font-semibold">{item.label}</span>
              <span className="block text-xs text-muted-foreground">
                {item.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
      <ErrorText id="condition-error" message={error} />
    </fieldset>
  );
}

export function AgeSelect({
  id,
  label,
  value,
  onChange,
  disabled,
  className,
  error,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  className?: string;
  error?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={className}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'age-error' : undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ages.map((age) => (
          <SelectItem key={age.value} value={age.value}>
            {age.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AgeField({
  label,
  error,
  ...props
}: Omit<Parameters<typeof AgeSelect>[0], 'label' | 'className'> & {
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label}</Label>
      <AgeSelect {...props} error={error} className="w-full" />
      {error && <ErrorText id="age-error" message={error} />}
    </div>
  );
}

export function AgeRangeFields({
  ageFrom,
  ageTo,
  onFromChange,
  onToChange,
  disabled,
  error,
}: {
  ageFrom: string;
  ageTo: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  disabled: boolean;
  error: string;
}) {
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2 text-sm leading-none font-medium">
        Child&apos;s age (optional)
      </legend>
      <div className="grid grid-cols-2 gap-4">
        <AgeField
          id="ageFrom"
          label="From"
          value={ageFrom}
          onChange={onFromChange}
          disabled={disabled}
        />
        <AgeField
          id="ageTo"
          label="To"
          value={ageTo}
          onChange={onToChange}
          disabled={disabled}
          error={error}
        />
      </div>
    </fieldset>
  );
}
