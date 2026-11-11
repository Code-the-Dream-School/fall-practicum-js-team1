
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ImageOff } from 'lucide-react';

import { ApiRequestError, getItem } from '@/api/client';
import ItemDetailsSkeleton from '@/components/ItemDetailsSkeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConditionChip } from '@/components/ui/ConditionChip';
import { StatusChip } from '@/components/ui/StatusChip';
import { Button } from '@/components/ui/button';
import { formatAgeRange } from '@/lib/formatAgeRange';
import { useAuthStore } from '@/store/authStore';

type ItemCondition = 'new' | 'like_new' | 'good' | 'used';

type ItemStatus =
  | 'available'
  | 'reserved'
  | 'picked_up'
  | 'withdrawn';

type ItemPhoto = {
  id: string;
  url: string;
  altText: string | null;
  position: number;
};

type ItemDetails = {
  id: string;
  title: string;
  description: string;
  category: {
    key: string;
    name: string;
  };
  owner: {
    id: string;
    name: string;
  };
  condition: ItemCondition;
  childAgeMinMonths: number | null;
  childAgeMaxMonths: number | null;
  city: string;
  state: string;
  status: ItemStatus;
  photos: ItemPhoto[];
  createdAt: string;
};

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [selectedPhotoId, setSelectedPhotoId] = useState<
    string | null
  >(null);

  const {
    data: item,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery<ItemDetails>({
    queryKey: ['item', id],
    queryFn: async () => (await getItem(id!)) as ItemDetails,
    enabled: Boolean(id),
    retry: (failureCount, queryError) => {
      if (
        queryError instanceof ApiRequestError &&
        queryError.status === 404
      ) {
        return false;
      }

      return failureCount < 2;
    },
  });

  const currentUserId = useAuthStore(
    (state) => state.user?.id ?? null
  );

  if (!id) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12 text-center">
        <h1 className="text-3xl font-bold">
          Item not found
        </h1>
        <Link
          to="/"
          className="mt-6 inline-block text-primary underline"
        >
          Go to Home page
        </Link>
      </main>
    );
  }

  if (isPending) {
    return <ItemDetailsSkeleton />;
  }

  if (isError) {
    if (
      error instanceof ApiRequestError &&
      error.status === 404
    ) {
      return (
        <main className="mx-auto max-w-6xl px-6 py-12 text-center">
          <h1 className="text-3xl font-bold">
            Item not found
          </h1>

          <p className="mt-3 text-muted-foreground">
            The item you are looking for could not be found.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block text-primary underline"
          >
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

  const photos = [...item.photos].sort(
    (a, b) => a.position - b.position
  );

  const selectedPhoto =
    photos.find((photo) => photo.id === selectedPhotoId) ??
    photos[0];

  const firstName = item.owner.name.trim().split(/\s+/)[0];

  const isOwner =
    currentUserId != null &&
    currentUserId === item.owner.id;

  const postedDate = new Date(
    item.createdAt
  ).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const categoryUrl = `/?category=${encodeURIComponent(
    item.category.key
  )}`;

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:underline">
          Browse
        </Link>

        <span className="mx-3">/</span>

        <Link
          to={categoryUrl}
          className="hover:underline"
        >
          {item.category.name}
        </Link>

        <span className="mx-3">/</span>

        <span aria-current="page">
          {item.title}
        </span>
      </nav>

      {/* Main item details */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Photo gallery */}
        <section aria-label="Item photos">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
            {selectedPhoto ? (
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.altText || item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ImageOff
                  className="h-20 w-20"
                  aria-hidden="true"
                />
                <p>No photo available</p>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {photos.map((photo, index) => {
                const isSelected =
                  photo.id === selectedPhoto?.id;

                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() =>
                      setSelectedPhotoId(photo.id)
                    }
                    aria-label={`View photo ${index + 1}`}
                    aria-pressed={isSelected}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${
                      isSelected
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.altText || item.title}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Item information */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <ConditionChip condition={item.condition} />
            <StatusChip
              kind="item"
              status={item.status}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              {item.title}
            </h1>

            <p className="mt-3 text-muted-foreground">
              Posted {postedDate} · {item.city},{' '}
              {item.state}
            </p>
          </div>

          {/* Owner: first name only */}
          <div className="border-y py-5">
            <p className="font-medium">
              Shared by {firstName}
            </p>
          </div>

          {/* Item attributes */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-4">
            <dt className="font-semibold">
              Category
            </dt>
            <dd>
              <Link
                to={categoryUrl}
                className="text-primary underline-offset-4 hover:underline"
              >
                {item.category.name}
              </Link>
            </dd>

            <dt className="font-semibold">
              Age range
            </dt>
            <dd>
              {formatAgeRange(
                item.childAgeMinMonths,
                item.childAgeMaxMonths
              )}
            </dd>

            <dt className="font-semibold">
              Condition
            </dt>

            <dd className="capitalize">
              {item.condition.replaceAll('_', ' ')}
            </dd>
          </dl>

          {/* Claim action: JIRA-45 handles behavior */}
          {isOwner ? (
            <p className="rounded-md bg-muted px-4 py-3 text-center font-medium">
              This is your item
            </p>
          ) : item.status === 'available' ? (
            <Button
              type="button"
              size="lg"
              className="w-full"
            >
              Request this item
            </Button>
          ) : item.status === 'reserved' ? (
            <Button
              type="button"
              size="lg"
              className="w-full"
            >
              Join the waiting list
            </Button>
          ) : (
            <p className="font-medium text-muted-foreground">
              This item is no longer available
            </p>
          )}
        </section>
      </div>

      {/* Description */}
      <section className="grid gap-6 border-t pt-10 md:grid-cols-2">
        <h2 className="text-3xl font-semibold">
          About this item
        </h2>

        <p className="whitespace-pre-line leading-7">
          {item.description}
        </p>
      </section>

      {/* Claim instructions */}
      <section className="rounded-lg bg-muted p-6 md:p-8">
        <h2 className="text-2xl font-semibold">
          How a claim works
        </h2>

        <ol className="mt-4 list-inside list-decimal space-y-3">
          <li>
            Request the item or join its waiting list.
          </li>
          <li>
            The owner reviews requests and approves a claim.
          </li>
          <li>
            Once approved, coordinate pickup privately
            with the owner.
          </li>
        </ol>

        <p className="mt-4 text-sm text-muted-foreground">
          Pickup addresses are shared privately after approval.
        </p>
      </section>
    </main>
  );
}
