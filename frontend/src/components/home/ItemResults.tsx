import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ItemCard } from '@/components/ui/ItemCard';
import { ItemCardSkeleton } from '@/components/ui/ItemCardSkeleton';

const SKELETON_COUNT = 8;
const gridClasses =
  'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4';

type ItemResultsProps = {
  items: ComponentProps<typeof ItemCard>['item'][];
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSeeMore: () => void;
  onClearFilters: () => void;
};

export const ItemResults = ({
  items,
  hasMore,
  isLoading,
  isError,
  onRetry,
  onSeeMore,
  onClearFilters,
}: ItemResultsProps) => {
  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ItemCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="Could not load items" onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No items match your search"
        message="Try fewer filters or a different word."
        action={{ label: 'Clear filters', onClick: onClearFilters }}
      />
    );
  }

  return (
    <>
      <div className={gridClasses}>
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8"
            onClick={onSeeMore}
          >
            See more
          </Button>
        </div>
      )}
    </>
  );
};
