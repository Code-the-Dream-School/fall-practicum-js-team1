import type { ReactNode } from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ages, conditions } from '@/lib/itemForm';

const COUNTER_SHOWN_FROM = 0.8;

export const fieldClass =
  'h-12 rounded-xl px-4 text-base md:text-base data-[size=default]:h-12';
export const textareaClass = 'rounded-xl px-4 py-3 text-base md:text-base';
export const labelClass = 'text-base font-semibold';

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

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
  title,
  hint,
  icon: Icon,
  tint,
  children,
}: {
  title: string;
  hint?: string;
  icon: LucideIcon;
  tint: { solid: string; soft: string };
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div aria-hidden="true" className={cn('h-1.5', tint.solid)} />
      <header
        className={cn(
          'flex items-center gap-3 border-b border-dashed border-border px-5 py-4 sm:px-6',
          tint.soft,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-2xl text-white',
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
      <div className="space-y-6 p-5 sm:p-6">{children}</div>
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
      <legend className="mb-2 text-base leading-none font-semibold">
        Condition *
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {conditions.map((item, index) => (
          <label key={item.value} className="group cursor-pointer">
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
                'relative block rounded-xl p-4 pr-10 ring-1 ring-border transition-colors hover:bg-muted peer-checked:bg-accent-blue/15 peer-checked:ring-2 peer-checked:ring-accent-blue peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
                error && 'ring-red-400',
              )}
            >
              <span className="block font-semibold">{item.label}</span>
              <span className="block text-sm text-muted-foreground">
                {item.hint}
              </span>
              <span
                aria-hidden="true"
                className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-accent-blue text-white opacity-0 transition-opacity group-has-checked:opacity-100"
              >
                <Check className="size-3.5" />
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
      <legend className="mb-1 text-base leading-none font-semibold">
        Child&apos;s age (optional)
      </legend>
      <FieldHint>
        Helps families find gear that fits their little one.
      </FieldHint>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ageFrom" className="text-sm">
            From
          </Label>
          <AgeSelect
            id="ageFrom"
            value={ageFrom}
            onChange={onFromChange}
            disabled={disabled}
            className={cn(fieldClass, 'w-full')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ageTo" className="text-sm">
            To
          </Label>
          <AgeSelect
            id="ageTo"
            value={ageTo}
            onChange={onToChange}
            disabled={disabled}
            error={error}
            className={cn(fieldClass, 'w-full')}
          />
          {error && <ErrorText id="age-error" message={error} />}
        </div>
      </div>
    </fieldset>
  );
}
