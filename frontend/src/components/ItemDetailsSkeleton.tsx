import { Skeleton } from '@/components/ui/skeleton';

export default function ItemDetailsSkeleton() {
  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">
      {/* Breadcrumb placeholder */}
      <Skeleton className="h-5 w-64" />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Photo gallery placeholder */}
        <section>
          <Skeleton className="aspect-square w-full rounded-lg" />

          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                className="aspect-square w-full rounded-md"
              />
            ))}
          </div>
        </section>

        {/* Item information placeholders */}
        <section className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
          </div>

          <div className="border-y py-5">
            <Skeleton className="h-5 w-40" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-3/4" />
          </div>

          <Skeleton className="h-10 w-full rounded-md" />
        </section>
      </div>

      {/* Description placeholder */}
      <section className="grid gap-6 border-t pt-10 md:grid-cols-2">
        <Skeleton className="h-9 w-52" />

        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </section>

      {/* Claim instructions placeholder */}
      <section className="space-y-4 rounded-lg bg-muted p-6 md:p-8">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </section>
    </main>
  );
}
