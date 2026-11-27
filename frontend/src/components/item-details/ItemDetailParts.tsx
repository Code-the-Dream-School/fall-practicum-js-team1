import type { ReactNode } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getInitials } from '@/lib/getInitials';
import { tints } from '@/lib/itemForm';
import { cn } from '@/lib/utils';

export const photoShapeClass =
  'overflow-hidden rounded-3xl bg-muted shadow-sm ring-1 ring-border';

export function PageBackdrop({
  variant = 'circles',
  className,
  children,
}: {
  variant?: 'circles' | 'blocks';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[color-mix(in_oklab,var(--primary)_7%,var(--background))] bg-[radial-gradient(color-mix(in_oklab,var(--primary)_32%,transparent)_1.25px,transparent_1.25px)] [background-size:22px_22px]',
        className,
      )}
    >
      {variant === 'circles' ? (
        <>
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-36 size-72 rounded-full bg-accent-sun/15"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-32 size-64 rounded-full bg-accent-blue/15 md:-bottom-32 md:-left-40 md:size-96"
          />
          <div
            aria-hidden="true"
            className="absolute top-1/2 -right-24 size-44 rounded-full border-[20px] border-accent-coral/15"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-10 left-1/3 size-28 rounded-full bg-accent-sage/20"
          />
        </>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-24 size-64 rotate-12 rounded-[2.5rem] bg-accent-sun/15"
          />
          <div
            aria-hidden="true"
            className="absolute top-1/3 -left-28 size-52 -rotate-12 rounded-[2.5rem] bg-accent-coral/15"
          />
          <div
            aria-hidden="true"
            className="absolute -right-20 -bottom-20 size-72 rotate-6 rounded-[3rem] bg-accent-blue/15"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-24 left-1/4 size-24 rotate-45 rounded-3xl border-[14px] border-accent-sage/20"
          />
        </>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

export function HeroBand({ children }: { children: ReactNode }) {
  return (
    <PageBackdrop className="border-b border-border/60 pb-12 md:pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        {children}
      </div>
    </PageBackdrop>
  );
}

export function FactList({ children }: { children: ReactNode }) {
  return (
    <dl className="divide-y divide-dashed divide-border overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
      {children}
    </dl>
  );
}

export function FactRow({
  icon: Icon,
  label,
  tint,
  badgeClassName,
  children,
}: {
  icon: LucideIcon;
  label: string;
  tint?: string;
  badgeClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          tint,
          badgeClassName ?? 'text-white',
        )}
      >
        <Icon className="size-[1.15rem]" />
      </span>
      <dt className="w-24 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-semibold">{children}</dd>
    </div>
  );
}

export function OwnerRow({ name }: { name: string }) {
  const firstName = name.split(' ').find(Boolean) ?? name;

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-coral/20 text-sm font-semibold ring-2 ring-accent-coral/50"
      >
        {getInitials(name)}
      </span>
      <p className="leading-tight">
        <span className="block text-xs text-muted-foreground">
          Handed down by
        </span>
        <span className="font-semibold">{firstName}</span>
      </p>
    </div>
  );
}

export function LocationAndDate({
  city,
  state,
  createdAt,
}: {
  city: string;
  state: string;
  createdAt: string;
}) {
  const postedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        {city}, {state}
      </span>
      <span className="flex items-center gap-1.5">
        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
        Posted {postedDate}
      </span>
    </p>
  );
}

export function PickupAreaCard({
  city,
  state,
  children,
}: {
  city: string;
  state: string;
  children?: ReactNode;
}) {
  return (
    <section className="self-start rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border max-md:mt-5 md:col-start-2 md:row-start-2">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl text-white',
            tints.sage.solid,
          )}
        >
          <MapPin className="size-5" />
        </span>
        <div className="leading-tight">
          <h2 className="font-sans text-xs font-medium text-muted-foreground">
            Pickup area
          </h2>
          <p className="text-lg font-semibold">
            {city}, {state}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
