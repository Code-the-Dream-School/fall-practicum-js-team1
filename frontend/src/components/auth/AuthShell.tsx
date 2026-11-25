import type { ReactNode } from 'react';
import headerBears from '@/assets/auth-header-bears.svg';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-10 -left-16 size-56 rounded-full bg-accent-sun/25"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-10 size-64 rounded-full bg-accent-blue/20"
      />

      <section className="relative mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <img
          src={headerBears}
          alt=""
          className="mx-auto aspect-1200/420 w-full rounded-3xl shadow-md dark:brightness-90"
        />

        <div className="relative mx-auto -mt-4 max-w-md">
          <div className="rounded-3xl bg-card p-6 shadow-lg ring-1 ring-border sm:p-8">
            <header className="mb-6 text-center">
              <h1 className="font-display text-4xl leading-tight font-bold tracking-tight">
                <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
                  {title}
                </span>
              </h1>
              <p className="mt-3 text-muted-foreground">{subtitle}</p>
            </header>
            {children}

            <p className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
