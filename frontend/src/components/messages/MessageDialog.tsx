import { ArrowLeft } from 'lucide-react';
import { MessageThread } from '@/components/messages/MessageThread';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type MessageDialogProps = {
  claimId: string;
  itemTitle: string;
  otherPersonName: string;
  isClosed: boolean;
  // when set, a back arrow with this text closes the dialog
  backLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const MessageDialog = ({
  claimId,
  itemTitle,
  otherPersonName,
  isClosed,
  backLabel,
  open,
  onOpenChange,
}: MessageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl max-sm:top-[calc(var(--vvt,0px)+0.5rem)] max-sm:flex max-sm:h-[calc(var(--vvh,100dvh)-1rem)] max-sm:translate-y-0 max-sm:flex-col max-sm:overflow-hidden"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            {backLabel && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={backLabel}
                title={backLabel}
                className="size-11 shrink-0 sm:size-8"
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft />
              </Button>
            )}
            <div className="min-w-0 space-y-1">
              <DialogTitle>{`Conversation about ${itemTitle}`}</DialogTitle>
              <DialogDescription>{`Messages with ${otherPersonName}.`}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <MessageThread
          claimId={claimId}
          otherPersonName={otherPersonName}
          isClosed={isClosed}
        />
      </DialogContent>
    </Dialog>
  );
};
