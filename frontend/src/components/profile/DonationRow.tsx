import { useState } from 'react';
import type { ComponentProps } from 'react';
import { ChevronRight } from 'lucide-react';
import { UnreadDot } from '@/components/messages/UnreadDot';
import { useUnreadMessages } from '@/components/messages/useUnreadMessages';
import { AvatarStack } from '@/components/profile/AvatarStack';
import { ConfirmButton } from '@/components/profile/ConfirmButton';
import { ProfileRow } from '@/components/profile/ProfileRow';
import { RequestsDialog } from '@/components/profile/RequestsDialog';
import type { DonationActions, ItemRequest } from '@/components/profile/types';
import { ConditionChip } from '@/components/ui/ConditionChip';
import type { ItemCard } from '@/components/ui/ItemCard';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatAgeRange } from '@/lib/formatAgeRange';

type DonationRowProps = {
  item: ComponentProps<typeof ItemCard>['item'];
  requests: ItemRequest[];
  // while the requests load or when loading them failed, an empty list must not say 'No requests yet'
  requestsLoading: boolean;
  requestsFailed: boolean;
  actions: DonationActions;
};

// the short sentence under an item that tells the owner where the requests stand
const getSummary = (requests: ItemRequest[]) => {
  if (requests.length === 0) {
    return 'No requests yet';
  }

  const pendingCount = requests.filter(
    (request) => request.status === 'pending',
  ).length;
  const approved = requests.find((request) => request.status === 'approved');

  if (approved) {
    const reserved = `Reserved for ${approved.claimer.name}`;
    return pendingCount > 0
      ? `${reserved}, ${pendingCount} on the waiting list`
      : reserved;
  }

  const total = `${requests.length} ${requests.length === 1 ? 'request' : 'requests'}`;
  return pendingCount > 0 ? `${total}, ${pendingCount} waiting for you` : total;
};

export const DonationRow = ({
  item,
  requests,
  requestsLoading,
  requestsFailed,
  actions,
}: DonationRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadByClaim = useUnreadMessages(
    requests.map((request) => request.id),
  );
  const hasUnread = Object.values(unreadByClaim).some((count) => count > 0);

  const approved = requests.find((request) => request.status === 'approved');
  const pickedUp = requests.find((request) => request.status === 'picked_up');
  const hasPending = requests.some((request) => request.status === 'pending');

  const withdrawButton = (
    <ConfirmButton
      label="Withdraw"
      title="Withdraw this item?"
      description="Pending requests will be declined and an approved request will be cancelled. You can restore the item later from your profile."
      confirmLabel="Withdraw item"
      className="text-destructive hover:text-destructive"
      onConfirm={() => actions.onWithdraw(item.id)}
    />
  );

  const getActions = () => {
    if (item.status === 'withdrawn') {
      return (
        <ConfirmButton
          label="Restore"
          title="Restore this item?"
          description="It will show on the Home page again and people can request it."
          confirmLabel="Restore item"
          variant="default"
          onConfirm={() => actions.onRestore(item.id)}
        />
      );
    }

    if (item.status === 'reserved' && approved) {
      return (
        <>
          <ConfirmButton
            label="Mark as picked up"
            title="Mark as picked up?"
            description={`This confirms ${approved.claimer.name} collected the item. Any request still waiting will be declined.`}
            confirmLabel="Mark as picked up"
            variant="default"
            onConfirm={() => actions.onPickedUp(item.id)}
          />
          {withdrawButton}
        </>
      );
    }

    if (item.status === 'available' || item.status === 'reserved') {
      return withdrawButton;
    }

    return null;
  };

  // the whole panel is the button, the negative margin and the wider width cancel the padding of the panel
  const requestsButton = (names: string[], text: string, isBold: boolean) => (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label={`Review requests for ${item.title}`}
      className="group -m-3 flex cursor-pointer w-[calc(100%+1.5rem)] items-center gap-3 rounded-xl p-3 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:-m-4 sm:w-[calc(100%+2rem)] sm:p-4"
    >
      <AvatarStack names={names} />
      <span
        className={`group-hover:underline ${isBold ? 'font-semibold' : ''}`}
      >
        {text}
      </span>
      {hasUnread && <UnreadDot className="ml-1" />}
      <ChevronRight
        className="ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );

  // the bottom panel, who picked it up, who asked, or nothing yet
  const getDetails = () => {
    if (item.status === 'withdrawn') {
      return null;
    }

    if (requestsFailed) {
      return <p>Could not load the requests for this item.</p>;
    }

    if (requestsLoading) {
      return <p>Loading requests…</p>;
    }

    // a picked up item can still open its requests, to read the messages
    if (item.status === 'picked_up') {
      if (!pickedUp) {
        return <p>Picked up</p>;
      }
      return requestsButton(
        [pickedUp.claimer.name],
        `Picked up by ${pickedUp.claimer.name}`,
        false,
      );
    }

    if (requests.length === 0) {
      return <p>No requests yet</p>;
    }

    return requestsButton(
      requests.map((request) => request.claimer.name),
      getSummary(requests),
      hasPending,
    );
  };

  return (
    <>
      <ProfileRow
        to={`/items/${item.id}`}
        muted={item.status === 'withdrawn'}
        photo={item.coverPhoto}
        title={item.title}
        chips={
          <>
            <StatusChip kind="item" status={item.status} />
            <ConditionChip condition={item.condition} />
          </>
        }
        meta={`${formatAgeRange(item.childAgeMinMonths, item.childAgeMaxMonths)} · ${item.city}`}
        actions={getActions()}
        details={getDetails()}
      />

      <RequestsDialog
        itemTitle={item.title}
        requests={requests}
        open={isOpen}
        onOpenChange={setIsOpen}
        onDecision={actions.onDecision}
        onNoShow={actions.onNoShow}
        unreadByClaim={unreadByClaim}
      />
    </>
  );
};
