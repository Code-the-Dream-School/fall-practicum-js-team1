import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  Baby,
  ChevronRight,
  Clock,
  HandHeart,
  ImageOff,
  PackageCheck,
  Pencil,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiRequestError,
  createClaim,
  getItem,
  getMyClaims,
} from '@/api/client';
import type { Claim, CreatedClaim, ItemShow } from '@/types';
import ItemDetailsSkeleton from '@/components/ItemDetailsSkeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { conditionBadges, conditions, tints } from '@/lib/itemForm';
import {
  FactList,
  FactRow,
  HeroBand,
  LocationAndDate,
  OwnerRow,
  PickupAreaCard,
  photoShapeClass,
} from '@/components/item-details/ItemDetailParts';
import { formatAgeRange } from '@/lib/formatAgeRange';
import { useAuthStore } from '@/store/authStore';

const MAX_MESSAGE_LENGTH = 500;

function StatusPill({ status }: { status: string }) {
  let label = '';
  let badge = '';
  let icon = <Clock className="size-4" />;

  if (status === 'reserved') {
    label = 'Reserved';
    badge = 'bg-status-reserved text-status-reserved-foreground';
  } else if (status === 'picked_up') {
    label = 'Picked up';
    badge = 'bg-status-picked-up text-status-picked-up-foreground';
    icon = <PackageCheck className="size-4" />;
  } else if (status === 'withdrawn') {
    label = 'Withdrawn';
    badge = 'bg-status-inactive text-status-inactive-foreground';
    icon = <Ban className="size-4" />;
  } else {
    return null;
  }

  return (
    <p className="inline-flex items-center gap-2 rounded-full bg-card py-1 pr-4 pl-1 text-sm font-semibold shadow-sm ring-1 ring-border">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-7 items-center justify-center rounded-full',
          badge,
        )}
      >
        {icon}
      </span>
      {label}
    </p>
  );
}

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<CreatedClaim | null>(
    null,
  );

  const {
    data: item,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery<ItemShow>({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: Boolean(id),
    retry: (failureCount, queryError) => {
      if (queryError instanceof ApiRequestError && queryError.status === 404) {
        return false;
      }

      return failureCount < 2;
    },
  });

  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const isCheckingSession = useAuthStore((state) => state.isCheckingSession);

  const {
    data: myClaims = [],
    isPending: isClaimsPending,
    isError: isClaimsError,
    refetch: refetchClaims,
  } = useQuery<Claim[]>({
    queryKey: ['myClaims', currentUserId],
    queryFn: () => getMyClaims(),
    enabled: Boolean(currentUserId),
    retry: false,
  });

  const existingClaim = myClaims.find(
    (claim) =>
      claim.item.id === id &&
      (claim.status === 'pending' || claim.status === 'approved'),
  );

  const currentClaim =
    submittedClaim?.itemId === id ? submittedClaim : existingClaim;

  const claimMutation = useMutation({
    mutationFn: () =>
      createClaim({
        itemId: id!,
        message: message.trim() || undefined,
      }),

    onSuccess: (claim) => {
      setSubmittedClaim(claim);
      setIsDialogOpen(false);
      setMessage('');
      setRequestError(null);

      toast.success('Request sent');

      void queryClient.invalidateQueries({ queryKey: ['myClaims'] });
      void queryClient.invalidateQueries({ queryKey: ['myStats'] });
      void queryClient.invalidateQueries({ queryKey: ['item', id] });
    },

    onError: (mutationError: unknown) => {
      if (mutationError instanceof ApiRequestError) {
        setRequestError(mutationError.message);
      } else {
        setRequestError('Unable to send request. Please try again.');
      }
    },
  });

  const handleRequestClick = () => {
    if (isCheckingSession) {
      return;
    }

    if (!currentUserId) {
      navigate('/login', {
        state: {
          from: {
            pathname: location.pathname,
          },
        },
      });
      return;
    }

    setRequestError(null);
    setMessage('');
    setIsDialogOpen(true);
  };

  const handleSendRequest = () => {
    if (
      !id ||
      !currentUserId ||
      message.length > MAX_MESSAGE_LENGTH ||
      claimMutation.isPending
    ) {
      return;
    }

    setRequestError(null);
    claimMutation.mutate();
  };

  if (!id) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12 text-center">
        <h1 className="text-3xl font-bold">Item not found</h1>
        <Link to="/" className="mt-6 inline-block text-primary underline">
          Go to Home page
        </Link>
      </main>
    );
  }

  if (isPending) {
    return <ItemDetailsSkeleton />;
  }

  if (isError) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return (
        <main className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h1 className="text-3xl font-bold">Item not found</h1>

          <p className="mt-3 text-muted-foreground">
            The item you are looking for could not be found.
          </p>

          <Link to="/" className="mt-6 inline-block text-primary underline">
            Go to Home page
          </Link>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <ErrorMessage
          message="Unable to load item details. Please try again."
          onRetry={() => {
            void refetch();
          }}
        />
      </main>
    );
  }

  if (!item) {
    return null;
  }

  const photos = [...item.photos].sort((a, b) => a.position - b.position);

  const selectedPhoto =
    photos.find((photo) => photo.id === selectedPhotoId) ?? photos[0];

  const isOwner = currentUserId !== null && currentUserId === item.owner.id;

  const categoryUrl = `/?category=${encodeURIComponent(item.category.key)}`;

  const canRequest = item.status === 'available' || item.status === 'reserved';
  const requestable = !isOwner && canRequest;

  const requestButtonText =
    item.status === 'reserved' ? 'Join the waiting list' : 'Request this item';

  const pillClass = 'h-14 w-full rounded-full text-base';

  const getAction = () => {
    if (isOwner) {
      return (
        <Button asChild className={pillClass}>
          <Link to={`/items/${item.id}/edit`}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit item
          </Link>
        </Button>
      );
    }

    if (!requestable) {
      return (
        <p className="rounded-full bg-muted px-4 py-3.5 text-center font-medium text-muted-foreground">
          This item is no longer available
        </p>
      );
    }

    if (currentClaim) {
      return (
        <div className="rounded-3xl bg-muted px-4 py-3 text-center">
          <p className="font-medium">You requested this item</p>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            Status: {currentClaim.status.replaceAll('_', ' ')}
          </p>
        </div>
      );
    }

    if (currentUserId && isClaimsPending) {
      return (
        <Button type="button" className={pillClass} disabled>
          Checking your requests...
        </Button>
      );
    }

    if (currentUserId && isClaimsError) {
      return (
        <div className="space-y-2">
          <p role="alert" className="text-center text-sm text-destructive">
            Unable to check your existing requests.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-full"
            onClick={() => {
              void refetchClaims();
            }}
          >
            Try again
          </Button>
        </div>
      );
    }

    return (
      <Button
        type="button"
        className={pillClass}
        onClick={handleRequestClick}
        disabled={isCheckingSession || claimMutation.isPending}
      >
        {item.status === 'available' && (
          <HandHeart className="size-5" aria-hidden="true" />
        )}
        {requestButtonText}
      </Button>
    );
  };

  const action = getAction();

  const selectedIndex = photos.findIndex(
    (photo) => photo.id === selectedPhoto?.id,
  );

  return (
    <main className="pb-10">
      <HeroBand>
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground hover:underline">
                Browse
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
            <li>
              <Link
                to={categoryUrl}
                className="hover:text-foreground hover:underline"
              >
                {item.category.name}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-4" />
            </li>
            <li aria-current="page" className="truncate text-foreground">
              {item.title}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start xl:gap-14">
          <section
            aria-label="Item photos"
            className="@container relative mx-auto w-full max-w-2xl xl:max-w-none"
          >
            <div
              className={cn(
                'relative flex aspect-[4/3] items-center justify-center',
                photoShapeClass,
              )}
            >
              {selectedPhoto ? (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.altText || item.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <ImageOff className="size-16" aria-hidden="true" />
                  <p>No photo available</p>
                </div>
              )}

              {photos.length > 1 && (
                <span className="absolute right-4 bottom-4 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background">
                  {selectedIndex + 1} / {photos.length}
                </span>
              )}
            </div>

            {photos.length > 1 && (
              <div className="mx-auto mt-3 flex w-fit max-w-full gap-2.5 overflow-x-auto p-1">
                {photos.map((photo, index) => {
                  const isSelected = photo.id === selectedPhoto?.id;

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhotoId(photo.id)}
                      aria-label={`View photo ${index + 1}`}
                      aria-pressed={isSelected}
                      className={cn(
                        'size-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-border transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none @md:size-16',
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'opacity-70 hover:opacity-100',
                      )}
                    >
                      <img
                        src={photo.url}
                        alt={photo.altText || item.title}
                        className="size-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div className="space-y-5">
            <div className="space-y-3">
              <StatusPill status={item.status} />
              <h1 className="text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
                {item.title}
              </h1>

              <LocationAndDate
                city={item.city}
                state={item.state}
                createdAt={item.createdAt}
              />
            </div>

            <FactList>
              <FactRow icon={Tag} label="Category" tint={tints.coral.solid}>
                <Link
                  to={categoryUrl}
                  className="underline-offset-4 hover:underline"
                >
                  {item.category.name}
                </Link>
              </FactRow>
              <FactRow icon={Baby} label="Child age" tint={tints.blue.solid}>
                {formatAgeRange(item.childAgeMinMonths, item.childAgeMaxMonths)}
              </FactRow>
              <FactRow
                icon={Sparkles}
                label="Condition"
                badgeClassName={conditionBadges[item.condition]}
              >
                {
                  conditions.find((entry) => entry.value === item.condition)
                    ?.label
                }
              </FactRow>
            </FactList>

            <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
              <OwnerRow name={item.owner.name} />

              <div className={cn(requestable && 'max-md:hidden')}>{action}</div>

              {!isOwner && (
                <p className="flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
                  <ShieldCheck
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  The pickup address is shared once the owner approves your
                  request.
                </p>
              )}
            </div>
          </div>
        </div>
      </HeroBand>

      <div className="mx-auto mt-10 grid max-w-6xl gap-y-3 px-4 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-x-14">
        <h2 className="text-2xl font-semibold md:col-start-1 md:row-start-1">
          <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,color-mix(in_oklab,var(--primary)_35%,transparent)_62%)]">
            About this item
          </span>
        </h2>
        <p className="max-w-prose text-lg leading-8 whitespace-pre-line md:col-start-1 md:row-start-2">
          {item.description}
        </p>

        <PickupAreaCard city={item.city} state={item.state} />
      </div>

      {requestable && (
        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mt-6 px-4 md:hidden">
          <div className="rounded-3xl bg-background/95 p-3 shadow-lg ring-1 ring-border backdrop-blur">
            {action}
          </div>
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (claimMutation.isPending) {
            return;
          }

          setIsDialogOpen(open);

          if (!open) {
            setRequestError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{requestButtonText}</DialogTitle>

            <DialogDescription>
              Send a request to the owner of this item. You can include an
              optional message.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSendRequest();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="claim-message" className="text-sm font-medium">
                Message (optional)
              </label>

              <textarea
                id="claim-message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setRequestError(null);
                }}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={4}
                disabled={claimMutation.isPending}
                placeholder="Write a message to the owner..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <p
                role="status"
                className={cn(
                  'text-right text-xs',
                  message.length >= MAX_MESSAGE_LENGTH
                    ? 'font-medium text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
                {message.length >= MAX_MESSAGE_LENGTH &&
                  ' — Character limit reached'}
              </p>
            </div>

            {requestError && (
              <p role="alert" className="text-sm text-destructive">
                {requestError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={claimMutation.isPending}
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  claimMutation.isPending || message.length > MAX_MESSAGE_LENGTH
                }
              >
                {claimMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
