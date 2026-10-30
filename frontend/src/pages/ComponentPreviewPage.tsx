// TEMPORARY preview of the JIRA-50 shared components
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { ConditionChip } from '@/components/ui/ConditionChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ItemCard } from '@/components/ui/ItemCard';
import { ItemCardSkeleton } from '@/components/ui/ItemCardSkeleton';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatAgeRange } from '@/lib/formatAgeRange';

const SIX_MONTHS = 6;
const ONE_YEAR_MONTHS = 12;
const THREE_YEARS_MONTHS = 36;
const LONG_TITLE_REPEATS = 8;

const itemStatuses = [
  'available',
  'reserved',
  'picked_up',
  'withdrawn',
] as const;
const claimStatuses = [
  'pending',
  'approved',
  'declined',
  'cancelled',
  'no_show',
  'picked_up',
] as const;
const conditions = ['new', 'like_new', 'good', 'used'] as const;

const testItems = [
  {
    id: '1',
    title: 'Graco stroller',
    condition: 'like_new',
    ageMinMonths: 0,
    ageMaxMonths: THREE_YEARS_MONTHS,
    city: 'Seattle',
    status: 'available',
    coverPhotoUrl: 'https://picsum.photos/400/300',
  },
  {
    id: '2',
    title: 'Very long title '.repeat(LONG_TITLE_REPEATS),
    condition: 'good',
    ageMinMonths: SIX_MONTHS,
    ageMaxMonths: null,
    city: 'Portland',
    status: 'reserved',
    coverPhotoUrl: null,
  },
  {
    id: '3',
    title: 'Wooden crib',
    condition: 'new',
    ageMinMonths: null,
    ageMaxMonths: null,
    city: 'Boise',
    status: 'picked_up',
    coverPhotoUrl: null,
  },
  {
    id: '4',
    title: 'Baby bouncer',
    condition: 'used',
    ageMinMonths: null,
    ageMaxMonths: ONE_YEAR_MONTHS,
    city: 'Tacoma',
    status: 'withdrawn',
    coverPhotoUrl: 'https://picsum.photos/400/400',
  },
] as const;

const ageExamples = [
  [null, null],
  [SIX_MONTHS, null],
  [null, ONE_YEAR_MONTHS],
  [0, SIX_MONTHS],
  [ONE_YEAR_MONTHS, ONE_YEAR_MONTHS],
] as const;

export default function ComponentPreviewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [retries, setRetries] = useState(0);

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <Button
        variant="outline"
        onClick={() => document.documentElement.classList.toggle('dark')}
      >
        Toggle dark mode
      </Button>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">StatusChip (item)</h2>
        <div className="flex flex-wrap gap-2">
          {itemStatuses.map((s) => (
            <StatusChip key={s} kind="item" status={s} />
          ))}
        </div>
        <h2 className="text-lg font-semibold">StatusChip (claim)</h2>
        <div className="flex flex-wrap gap-2">
          {claimStatuses.map((s) => (
            <StatusChip key={s} kind="claim" status={s} />
          ))}
        </div>
        <h2 className="text-lg font-semibold">ConditionChip</h2>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <ConditionChip key={c} condition={c} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">formatAgeRange</h2>
        <ul className="text-sm">
          {ageExamples.map(([min, max]) => (
            <li key={`${min}-${max}`}>
              ({String(min)}, {String(max)}) → {formatAgeRange(min, max)}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">ItemCard / ItemCardSkeleton</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLoading((v) => !v)}
          >
            {isLoading ? 'Show cards' : 'Show loading'}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? testItems.map((item) => <ItemCardSkeleton key={item.id} />)
            : testItems.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">EmptyState</h2>
        <EmptyState
          title="No items found"
          message="Try changing your filters or search."
          action={{
            label: 'Clear filters',
            onClick: () => toast.info('Filters cleared'),
          }}
        />
        <EmptyState title="Title only (no message, no button)" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ErrorMessage</h2>
        <ErrorMessage
          message={`Could not load items. (retried ${retries} times)`}
          onRetry={() => setRetries((n) => n + 1)}
        />
        <ErrorMessage message="Message only (no Try again button)" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Alert dialog and toast</h2>
        <div className="flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Open alert dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel this claim?</AlertDialogTitle>
                <AlertDialogDescription>
                  The owner will be told you are no longer interested.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep claim</AlertDialogCancel>
                <AlertDialogAction>Cancel claim</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            onClick={() => toast.success('Item posted')}
          >
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error('Something went wrong')}
          >
            Error toast
          </Button>
        </div>
      </section>
    </div>
  );
}
