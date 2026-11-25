import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';

// Same structure and row heights as ItemCard, so nothing jumps when data loads
export const ItemCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl bg-card p-2 ring-1 ring-border"
    >
      <AspectRatio ratio={1}>
        <Skeleton className="size-full rounded-xl" />
      </AspectRatio>
      <div className="mt-3 space-y-1.5 px-1.5 pb-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
};
