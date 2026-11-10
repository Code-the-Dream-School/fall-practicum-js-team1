import type { LucideIcon } from 'lucide-react';
import { ClaimRow } from '@/components/profile/ClaimRow';
import { ProfileRowsSkeleton } from '@/components/profile/ProfileRow';
import { StatCards, StatCardsSkeleton } from '@/components/profile/StatCards';
import type { ProfileClaim } from '@/components/profile/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

type ClaimsSectionProps = {
  stats: { label: string; value: number; icon: LucideIcon }[];
  claims: ProfileClaim[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onBrowse: () => void;
  onCancel: (claimId: string) => void;
};

export const ClaimsSection = ({
  stats,
  claims,
  isLoading,
  isError,
  onRetry,
  onBrowse,
  onCancel,
}: ClaimsSectionProps) => {
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
      <ErrorMessage message="Could not load your claims" onRetry={onRetry} />
    );
  }

  return (
    <div className="space-y-6">
      <StatCards stats={stats} />

      {claims.length === 0 ? (
        <EmptyState
          title="You haven't requested anything yet"
          action={{ label: 'Browse items', onClick: onBrowse }}
        />
      ) : (
        <ul className="space-y-3">
          {claims.map((claim) => (
            <ClaimRow key={claim.id} claim={claim} onCancel={onCancel} />
          ))}
        </ul>
      )}
    </div>
  );
};
