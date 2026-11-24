import { Skeleton } from '@/components/ui/skeleton';

const placeholderCount = 3;

const placeholders = Array.from(
  { length: placeholderCount },
  (_, index) => index,
);

export default function ItemDetailsSkeleton() {
  return (
    <main className="pb-10" aria-hidden="true">
      <section className="bg-[color-mix(in_oklab,var(--primary)_9%,var(--background))] pb-16 [clip-path:ellipse(135%_100%_at_50%_0%)] md:pb-24">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
          <Skeleton className="h-5 w-64" />

          <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:items-center xl:gap-16">
            <div>
              <Skeleton className="aspect-[4/3] w-full rounded-[2rem_2rem_2rem_0.75rem] xl:aspect-square md:rounded-[3.5rem_3.5rem_3.5rem_1rem]" />
              <div className="relative mt-3 flex justify-center gap-2.5">
                {placeholders.map((index) => (
                  <Skeleton key={index} className="size-12 rounded-2xl" />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-12 w-4/5" />
                <Skeleton className="h-5 w-3/5" />
              </div>
              <div className="flex flex-wrap gap-2.5">
                {placeholders.map((index) => (
                  <Skeleton key={index} className="h-14 w-40 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-11 w-40 rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-6 grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-16">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-20 w-full rounded-[2rem]" />
      </div>
    </main>
  );
}
