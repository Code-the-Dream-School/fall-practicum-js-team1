import type { ComponentProps } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type ConfirmButtonProps = {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  className?: string;
  onConfirm: () => void;
};

export const ConfirmButton = ({
  label,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Not now',
  variant = 'outline',
  className,
  onConfirm,
}: ConfirmButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
