import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FilterSelectProps = {
  label: string;
  allLabel: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export const FilterSelect = ({
  label,
  allLabel,
  value,
  options,
  onChange,
}: FilterSelectProps) => {
  const handleChange = (newValue: string) => {
    onChange(newValue === 'all' ? '' : newValue);
  };

  return (
    <Select value={value || 'all'} onValueChange={handleChange}>
      <SelectTrigger aria-label={label} className="w-full bg-background">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
