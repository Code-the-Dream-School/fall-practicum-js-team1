import { MessageCircle } from 'lucide-react';
import { ConfirmButton } from '@/components/profile/ConfirmButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatShortDate } from '@/lib/formatDate';
import type { Decision, ItemRequest } from '@/components/profile/types';

type RequestsDialogProps = {
  itemTitle: string;
  requests: ItemRequest[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecision: (claimId: string, decision: Decision) => void;
  onNoShow: (claimId: string) => void;
};

export const RequestsDialog = ({
  itemTitle,
  requests,
  open,
  onOpenChange,
  onDecision,
  onNoShow,
}: RequestsDialogProps) => {
  const pendingCount = requests.filter(
    (request) => request.status === 'pending',
  ).length;
  const hasApproved = requests.some((request) => request.status === 'approved');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // no X, the list has a Close button at the bottom
        showCloseButton={false}
        // focus the dialog itself, so the first button (Decline) does not open with a focus ring
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Requests for {itemTitle}</DialogTitle>
          <DialogDescription>
            {requests.length} {requests.length === 1 ? 'request' : 'requests'},{' '}
            {pendingCount} waiting for your answer.
          </DialogDescription>
        </DialogHeader>

        {/* an item can only have one approved request, the others wait in case it is cancelled */}
        {hasApproved && (
          <p className="rounded-lg bg-section p-3 text-sm">
            You already approved one request. The others stay on the waiting
            list in case it is cancelled.
          </p>
        )}

        <ul className="space-y-3">
          {requests.map((request) => {
            const isActive =
              request.status === 'pending' || request.status === 'approved';

            return (
              <li
                key={request.id}
                className="space-y-3 rounded-lg border bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{request.claimer.name}</p>
                  <StatusChip kind="claim" status={request.status} />
                </div>

                <p className="text-sm text-muted-foreground">
                  Requested {formatShortDate(request.createdAt)}
                </p>

                <p className="text-sm">
                  {request.message ? `"${request.message}"` : 'No message.'}
                </p>

                <div className="flex flex-col gap-2 *:h-11 sm:flex-row sm:flex-wrap sm:items-center sm:*:h-8">
                  {request.status === 'pending' && (
                    <>
                      {!hasApproved && (
                        <Button
                          size="sm"
                          onClick={() => onDecision(request.id, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDecision(request.id, 'declined')}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <ConfirmButton
                      label="Mark as no-show"
                      title="Mark as a no-show?"
                      description={`${request.claimer.name} did not come. The item goes back to available, so you can approve someone else.`}
                      confirmLabel="Mark as no-show"
                      onConfirm={() => onNoShow(request.id)}
                    />
                  )}
                  {isActive && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="sm:ml-auto"
                    >
                      <MessageCircle />
                      Message
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <Button
          type="button"
          variant="outline"
          className="h-11 sm:h-8"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};
