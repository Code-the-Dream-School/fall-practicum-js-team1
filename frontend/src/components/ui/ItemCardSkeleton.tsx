import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Same structure and row heights as ItemCard, so nothing jumps when data loads
export const ItemCardSkeleton = () => {
  return (
    <Card className="gap-0 py-0" aria-hidden="true">
      <AspectRatio ratio={1}>
        <Skeleton className="size-full rounded-none" />
      </AspectRatio>
      <CardContent className="space-y-1 py-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-1/2" />
      </CardContent>
    </Card>
  );
};
