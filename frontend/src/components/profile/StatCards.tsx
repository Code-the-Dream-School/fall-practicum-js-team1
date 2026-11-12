import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type StatCardsProps = {
  stats: { label: string; value: number; icon: LucideIcon }[];
};

const STAT_COUNT = 4;

// one color for each of the four numbers, from the theme
const accents = [
  { bar: 'border-stat-bar-blue', tint: 'bg-stat-bar-blue/20' },
  { bar: 'border-stat-bar-yellow', tint: 'bg-stat-bar-yellow/20' },
  { bar: 'border-stat-bar-green', tint: 'bg-stat-bar-green/20' },
  { bar: 'border-stat-bar-pink', tint: 'bg-stat-bar-pink/20' },
];

export const StatCards = ({ stats }: StatCardsProps) => {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat, index) => (
        <li
          key={stat.label}
          className={`flex items-center gap-3 rounded-2xl border-t-4 bg-card p-4 shadow-sm ${accents[index]?.bar ?? ''}`}
        >
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-full ${accents[index]?.tint ?? ''}`}
          >
            <stat.icon className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col-reverse">
            <span className="text-sm leading-tight text-muted-foreground">
              {stat.label}
            </span>
            <span className="text-3xl leading-tight font-bold">
              {stat.value}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
};

export const StatCardsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden="true">
      {Array.from({ length: STAT_COUNT }, (_, index) => (
        <Skeleton key={index} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
};
