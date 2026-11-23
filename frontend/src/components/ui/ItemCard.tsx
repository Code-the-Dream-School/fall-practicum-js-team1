import { Link } from 'react-router';
import { Baby, ImageOff, MapPin } from 'lucide-react';
import { formatAgeRange } from '@/lib/formatAgeRange';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ConditionChip, type ItemCondition } from './ConditionChip';
import { StatusChip, type ItemStatus } from './StatusChip';

type ItemCardProps = {
  item: {
    id: string;
    title: string;
    condition: ItemCondition;
    status: ItemStatus;
    childAgeMinMonths: number | null;
    childAgeMaxMonths: number | null;
    city: string;
    coverPhoto: { url: string; altText: string } | null;
  };
};

export const ItemCard = ({ item }: ItemCardProps) => {
  return (
    <Link
      to={`/items/${item.id}`}
      className="group block min-w-0 rounded-2xl bg-card p-2 ring-1 ring-border transition-shadow duration-300 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative overflow-hidden rounded-xl bg-photo-placeholder">
        <AspectRatio ratio={1}>
          {item.coverPhoto ? (
            <img
              src={item.coverPhoto.url}
              alt={item.coverPhoto.altText}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff />
            </div>
          )}
        </AspectRatio>

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 [&_[data-slot=badge]]:shadow-sm">
          <ConditionChip condition={item.condition} />
          {item.status !== 'available' && (
            <StatusChip kind="item" status={item.status} />
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 px-1.5 pb-1">
        <h3 className="truncate leading-snug font-semibold">{item.title}</h3>

        <p className="flex items-start gap-1.5 text-sm leading-snug font-medium">
          <Baby
            className="mt-px size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          {formatAgeRange(item.childAgeMinMonths, item.childAgeMaxMonths)}
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.city}</span>
        </p>
      </div>
    </Link>
  );
};
