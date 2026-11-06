import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
};

export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => {
  return (
    <Alert
      variant="destructive"
      className="flex flex-col items-center gap-3 py-4 text-center"
    >
      <div className="flex items-center gap-2">
        <CircleAlert className="size-4 shrink-0" />
        <AlertDescription className="text-destructive">
          {message}
        </AlertDescription>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
};
