import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

type EmptyStateProps = {
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
};

export const EmptyState = ({ title, message, action }: EmptyStateProps) => {
  return (
    <Empty className="bg-muted">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {message && <EmptyDescription>{message}</EmptyDescription>}
      </EmptyHeader>
      {action && (
        <EmptyContent>
          <Button onClick={action.onClick}>{action.label}</Button>
        </EmptyContent>
      )}
    </Empty>
  );
};
