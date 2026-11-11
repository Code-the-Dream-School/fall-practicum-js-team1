import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SKELETON_COUNT = 3;
const thumbClasses = 'size-16 shrink-0 overflow-hidden rounded-xl sm:size-20';

type ProfileRowProps = {
  // no link means the item can not be opened
  to?: string;
  photo: { url: string; altText: string } | null;
  title: string;
  chips: ReactNode;
  meta: ReactNode;
  actions?: ReactNode;
  details?: ReactNode;
  // greyed out, but the link and the buttons to restore it still work
  muted?: boolean;
};

// one row for both lists, so My donations and My claims look the same
export const ProfileRow = ({
  to,
  photo,
  title,
  chips,
  meta,
  actions,
  details,
  muted = false,
}: ProfileRowProps) => {
  const image = photo ? (
    <img src={photo.url} alt="" className="size-full object-cover" />
  ) : (
    <div className="flex size-full items-center justify-center bg-photo-placeholder">
      <ImageOff />
    </div>
  );

  return (
    <li className="relative space-y-3 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`flex min-w-0 flex-1 basis-64 items-center gap-4 ${muted ? 'opacity-50 grayscale' : ''}`}
        >
          {to ? (
            <Link
              to={to}
              tabIndex={-1}
              aria-hidden="true"
              className={thumbClasses}
            >
              {image}
            </Link>
          ) : (
            <div className={thumbClasses}>{image}</div>
          )}

          <div className="min-w-0 flex-1 space-y-1.5">
            {to ? (
              <Link
                to={to}
                // the box stretches over the whole card, so a tap anywhere opens the item
                className="block truncate font-semibold hover:underline after:absolute after:inset-0 after:rounded-2xl"
              >
                {title}
              </Link>
            ) : (
              <p className="truncate font-semibold">{title}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">{chips}</div>
            <p className="text-sm text-muted-foreground">{meta}</p>
          </div>
        </div>

        {actions && (
          <div className="relative z-10 flex w-full flex-wrap gap-2 sm:w-auto *:h-11 *:flex-1 *:text-sm sm:*:h-8 sm:*:flex-none">
            {actions}
          </div>
        )}
      </div>

      {details && (
        <div className="relative z-10 rounded-xl bg-section p-3 text-sm sm:p-4">
          {details}
        </div>
      )}
    </li>
  );
};

export const ProfileRowsSkeleton = () => {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
};
