import type { ReactNode } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getInitials } from '@/lib/getInitials';
import { tints } from '@/lib/itemForm';
import { cn } from '@/lib/utils';

export const photoShapeClass =
  'overflow-hidden rounded-[2rem_2rem_2rem_0.75rem] bg-muted shadow-xl ring-1 ring-black/5 md:rounded-[3.5rem_3.5rem_3.5rem_1rem]';

export function HeroBand({ children }: { children: ReactNode }) {
  return (
    <section className="bg-[color-mix(in_oklab,var(--primary)_9%,var(--background))] pb-16 [clip-path:ellipse(135%_100%_at_50%_0%)] md:pb-24">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        {children}
      </div>
    </section>
  );
}

// The cqw units size the circles from the photo section, which is a container.
export function PhotoBlobs() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute top-[10cqw] -left-[14cqw] aspect-square w-[33cqw] rounded-full bg-accent-sun/30"
      />
      <div
        aria-hidden="true"
        className="absolute -right-[3cqw] -bottom-[7cqw] aspect-square w-[28cqw] rounded-full bg-accent-blue/25"
      />
    </>
  );
}

export function FactPill({
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
    <div className="flex min-w-0 items-center gap-2.5 rounded-3xl bg-card py-1.5 pr-4 pl-1.5 shadow-sm ring-1 ring-border">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          tint,
          badgeClassName ?? 'text-white',
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 leading-tight">
        <span className="block text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <div className="font-semibold">{children}</div>
      </div>
    </div>
  );
}

export function OwnerRow({ name }: { name: string }) {
  const firstName = name.split(' ').find(Boolean) ?? name;

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-sm font-semibold shadow-sm ring-1 ring-border"
      >
        {getInitials(name)}
      </span>
      <p className="leading-tight">
        <span className="block text-xs text-muted-foreground">Shared by</span>
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
    <section className="self-start rounded-[2rem] border-2 border-solid border-accent-sage/40 bg-card p-5 max-md:mt-5 md:col-start-2 md:row-start-2">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full text-white',
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
