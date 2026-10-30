import { Badge } from '@/components/ui/badge';

export type ItemCondition = 'new' | 'like_new' | 'good' | 'used';

const conditionStyles: Record<
  ItemCondition,
  { label: string; className: string }
> = {
  new: { label: 'New', className: 'bg-condition-new text-foreground' },
  like_new: {
    label: 'Like New',
    className: 'bg-condition-like-new text-foreground',
  },
  good: { label: 'Good', className: 'bg-condition-good text-foreground' },
  used: { label: 'Used', className: 'bg-condition-used text-foreground' },
};

export const ConditionChip = ({ condition }: { condition: ItemCondition }) => {
  const entry = conditionStyles[condition];

  return <Badge className={entry.className}>{entry.label}</Badge>;
};
