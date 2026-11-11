import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ActiveFiltersProps = {
  filters: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
};

export const ActiveFilters = ({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => onRemove(filter.key)}
          aria-label={`Remove filter: ${filter.label}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-filter-selected px-3 py-1 text-sm font-medium transition-colors hover:bg-filter-selected/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {filter.label}
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
};
