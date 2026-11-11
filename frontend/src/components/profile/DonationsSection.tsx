import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DonationRow } from '@/components/profile/DonationRow';
import { ProfileRowsSkeleton } from '@/components/profile/ProfileRow';
import { StatCards, StatCardsSkeleton } from '@/components/profile/StatCards';
import type { DonationActions, ItemRequest } from '@/components/profile/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { ItemCard } from '@/components/ui/ItemCard';

type DonationsSectionProps = {
  stats: { label: string; value: number; icon: LucideIcon }[];
  items: ComponentProps<typeof ItemCard>['item'][];
  requests: Record<string, ItemRequest[]>;
  requestsLoading: boolean;
  requestsError: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPostItem: () => void;
  actions: DonationActions;
};

export const DonationsSection = ({
  stats,
  items,
  requests,
  requestsLoading,
  requestsError,
  isLoading,
  isError,
  onRetry,
  onPostItem,
  actions,
}: DonationsSectionProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatCardsSkeleton />
        <ProfileRowsSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorMessage message="Could not load your donations" onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <StatCards stats={stats} />

      {items.length === 0 ? (
        <EmptyState
          title="You haven't donated anything yet"
          action={{ label: 'Post an item', onClick: onPostItem }}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <DonationRow
              key={item.id}
              item={item}
              requests={requests[item.id] ?? []}
              requestsLoading={requestsLoading}
              requestsFailed={requestsError}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
