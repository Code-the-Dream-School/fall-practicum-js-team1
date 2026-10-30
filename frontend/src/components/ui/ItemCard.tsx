import { Link } from 'react-router';
import { ImageOff } from 'lucide-react';
import { formatAgeRange } from '@/lib/formatAgeRange';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent } from '@/components/ui/card';
import { ConditionChip, type ItemCondition } from './ConditionChip';
import { StatusChip, type ItemStatus } from './StatusChip';

type ItemCardProps = {
  item: {
    id: string;
    title: string;
    condition: ItemCondition;
    status: ItemStatus;
    ageMinMonths: number | null;
    ageMaxMonths: number | null;
    city: string;
    coverPhotoUrl: string | null;
  };
};

export const ItemCard = ({ item }: ItemCardProps) => {
  return (
    <Link to={`/items/${item.id}`} className="group block">
      <Card className="gap-0 py-0 transition-shadow group-hover:shadow-md">
        <AspectRatio ratio={1}>
          {item.coverPhotoUrl ? (
            <img
              src={item.coverPhotoUrl}
              alt=""
              className="size-full object-cover transition-opacity group-hover:opacity-90"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-photo-placeholder">
              <ImageOff />
            </div>
          )}
        </AspectRatio>

        <CardContent className="space-y-1 py-3">
          <h3 className="line-clamp-2 font-semibold group-hover:underline">
            {item.title}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            <ConditionChip condition={item.condition} />
            {item.status !== 'available' && (
              <StatusChip kind="item" status={item.status} />
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {formatAgeRange(item.ageMinMonths, item.ageMaxMonths)} · {item.city}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
