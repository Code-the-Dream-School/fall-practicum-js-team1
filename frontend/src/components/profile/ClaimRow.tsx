import type { ProfileClaim } from '@/components/profile/types';
import { MessageCircle } from 'lucide-react';
import { formatShortDate } from '@/lib/formatDate';
import { CancelClaimButton } from '@/components/profile/CancelClaimButton';
import { ProfileRow } from '@/components/profile/ProfileRow';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/StatusChip';

type ClaimRowProps = {
  claim: ProfileClaim;
  onCancel: (claimId: string) => void;
};

export const ClaimRow = ({ claim, onCancel }: ClaimRowProps) => {
  const { item, pickup } = claim;
  // only a pending or approved request can still be cancelled or talked about
  const isActive = claim.status === 'pending' || claim.status === 'approved';

  return (
    <ProfileRow
      to={`/items/${item.id}`}
      photo={item.coverPhoto}
      title={item.title}
      chips={<StatusChip kind="claim" status={claim.status} />}
      meta={`Requested ${formatShortDate(claim.createdAt)}`}
      actions={
        isActive && (
          <>
            <Button type="button" variant="outline" size="sm">
              <MessageCircle />
              Message
            </Button>
            <CancelClaimButton
              itemTitle={item.title}
              isApproved={claim.status === 'approved'}
              onConfirm={() => onCancel(claim.id)}
            />
          </>
        )
      }
      // the street address is only here while the claim is approved
      details={
        pickup && (
          <div className="space-y-2">
            <h4 className="font-semibold">Pickup details</h4>
            <p>
              {pickup.line1}
              {pickup.line2 && `, ${pickup.line2}`}
              <br />
              {pickup.city}, {pickup.state} {pickup.postalCode}
            </p>
            {pickup.instructions && (
              <p>
                <span className="font-medium">Instructions: </span>
                {pickup.instructions}
              </p>
            )}
            {pickup.availability && (
              <p>
                <span className="font-medium">Availability: </span>
                {pickup.availability}
              </p>
            )}
          </div>
        )
      }
    />
  );
};
