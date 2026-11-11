import { ConfirmButton } from '@/components/profile/ConfirmButton';

type CancelClaimButtonProps = {
  itemTitle: string;
  isApproved: boolean;
  onConfirm: () => void;
};

export const CancelClaimButton = ({
  itemTitle,
  isApproved,
  onConfirm,
}: CancelClaimButtonProps) => {
  return (
    <ConfirmButton
      label="Cancel request"
      title="Cancel your request?"
      description={
        isApproved
          ? `The owner already approved you for ${itemTitle}. If you cancel, the item goes back to available and the owner is told you are no longer interested.`
          : `The owner of ${itemTitle} will be told you are no longer interested.`
      }
      confirmLabel="Cancel request"
      cancelLabel="Keep request"
      onConfirm={onConfirm}
    />
  );
};
