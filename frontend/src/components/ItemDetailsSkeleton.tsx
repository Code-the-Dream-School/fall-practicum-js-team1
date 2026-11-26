import { Skeleton } from '@/components/ui/skeleton';

export default function ItemDetailsSkeleton() {
  return (
    <main className="pb-10" aria-hidden="true">
      <section className="border-b border-border/60 bg-[color-mix(in_oklab,var(--primary)_7%,var(--background))] pb-10 md:pb-14">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <Skeleton className="h-5 w-64" />

          <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start xl:gap-14">
            <div>
              <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
              <div className="mt-3 flex gap-2.5 p-1">
                <Skeleton className="size-14 rounded-xl" />
                <Skeleton className="size-14 rounded-xl" />
                <Skeleton className="size-14 rounded-xl" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <Skeleton className="h-12 w-4/5" />
                <Skeleton className="h-5 w-3/5" />
              </div>
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </main>
  );
}
