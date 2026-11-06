import { MapPin } from 'lucide-react';
import { FilterSelect } from '@/components/home/FilterSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FilterBarProps = {
  filters: {
    param: string;
    label: string;
    allLabel: string;
    value: string;
    options: { value: string; label: string }[];
  }[];
  city: string;
  onFilterChange: (param: string, value: string) => void;
};

export const FilterBar = ({
  filters,
  city,
  onFilterChange,
}: FilterBarProps) => {
  const handleCity = (value: string) => {
    const text = value.trim();
    if (text !== city) {
      onFilterChange('city', text);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {filters.map((filter) => (
        <FilterSelect
          key={filter.param}
          label={filter.label}
          allLabel={filter.allLabel}
          value={filter.value}
          options={filter.options}
          onChange={(value) => onFilterChange(filter.param, value)}
        />
      ))}

      <div className="relative">
        <MapPin
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Label htmlFor="city" className="sr-only">
          City
        </Label>
        <Input
          key={city}
          id="city"
          defaultValue={city}
          placeholder="City"
          className="bg-background pl-9"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleCity(event.currentTarget.value);
            }
          }}
          onBlur={(event) => handleCity(event.currentTarget.value)}
        />
      </div>
    </div>
  );
};
