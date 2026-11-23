import type { ProfileClaim } from '@/components/profile/types';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { formatShortDate } from '@/lib/formatDate';
import { CancelClaimButton } from '@/components/profile/CancelClaimButton';
import { ProfileRow } from '@/components/profile/ProfileRow';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/StatusChip';
import { MessageDialog } from '@/components/messages/MessageDialog';
import { UnreadDot } from '@/components/messages/UnreadDot';
import { useUnreadMessages } from '@/components/messages/useUnreadMessages';

type ClaimRowProps = {
  claim: ProfileClaim;
  onCancel: (claimId: string) => void;
};

export const ClaimRow = ({ claim, onCancel }: ClaimRowProps) => {
  const { item, pickup } = claim;
  const ownerName = item.owner.name;
  const [messageOpen, setMessageOpen] = useState(false);
  const unreadCount = useUnreadMessages([claim.id])[claim.id] ?? 0;

  // only a pending or approved request can still be cancelled or talked about
  const isActive = claim.status === 'pending' || claim.status === 'approved';

  return (
    <>
      <ProfileRow
        to={`/items/${item.id}`}
        photo={item.coverPhoto}
        title={item.title}
        chips={<StatusChip kind="claim" status={claim.status} />}
        meta={
          <>
            {ownerName && (
              <span className="block">
                <span className="font-medium text-foreground">{ownerName}</span>
              </span>
            )}
            <span className="block">
              Requested {formatShortDate(claim.createdAt)}
            </span>
          </>
        }
        actions={
          isActive ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => setMessageOpen(true)}
              >
                <MessageCircle />
                Message
                {unreadCount > 0 && (
                  <UnreadDot className="absolute -top-1 -right-1" />
                )}
              </Button>
              <CancelClaimButton
                itemTitle={item.title}
                isApproved={claim.status === 'approved'}
                onConfirm={() => onCancel(claim.id)}
              />
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative"
              onClick={() => setMessageOpen(true)}
            >
              <MessageCircle />
              View messages
              {unreadCount > 0 && (
                <UnreadDot className="absolute -top-1 -right-1" />
              )}
            </Button>
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
      <MessageDialog
        claimId={claim.id}
        itemTitle={item.title}
        otherPersonName={ownerName}
        backLabel="Back to my claims"
        isClosed={!isActive}
        open={messageOpen}
        onOpenChange={setMessageOpen}
      />
    </>
  );
};
