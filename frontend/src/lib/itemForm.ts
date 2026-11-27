import type { ItemCondition } from '@/components/ui/ConditionChip';

export const limits = {
  title: 80,
  description: 1000,
  instructions: 300,
  availability: 200,
  photos: 6,
};

export const conditions: {
  value: ItemCondition;
  label: string;
  hint: string;
}[] = [
  { value: 'new', label: 'New', hint: 'Unused, maybe still in the box' },
  { value: 'like_new', label: 'Like new', hint: 'Used a few times, no wear' },
  { value: 'good', label: 'Good', hint: 'Normal wear, works great' },
  { value: 'used', label: 'Used', hint: 'Visible wear, still safe' },
];

export const ages = [
  { value: 'any', label: 'Any' },
  { value: '0', label: 'Newborn' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '9', label: '9 months' },
  { value: '12', label: '1 year' },
  { value: '18', label: '18 months' },
  { value: '24', label: '2 years' },
  { value: '36', label: '3 years' },
  { value: '48', label: '4 years' },
  { value: '60', label: '5 years' },
];

export const tints = {
  coral: { solid: 'bg-accent-coral', soft: 'bg-accent-coral/15' },
  blue: { solid: 'bg-accent-blue', soft: 'bg-accent-blue/15' },
  sage: { solid: 'bg-accent-sage', soft: 'bg-accent-sage/15' },
};

export const conditionBadges: Record<string, string> = {
  new: 'bg-condition-new text-foreground',
  like_new: 'bg-condition-like-new text-foreground',
  good: 'bg-condition-good text-foreground',
  used: 'bg-condition-used text-foreground',
};
