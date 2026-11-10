import { getInitials } from '@/lib/getInitials';

const MAX_VISIBLE = 3;

type AvatarStackProps = {
  names: string[];
};

// small overlapping circles, one for each person
export const AvatarStack = ({ names }: AvatarStackProps) => {
  const visible = names.slice(0, MAX_VISIBLE);
  const hiddenCount = names.length - visible.length;

  return (
    <div className="flex items-center" aria-hidden="true">
      {visible.map((name, index) => (
        <span
          key={`${name}-${index}`}
          className="-ml-1.5 flex size-7 items-center justify-center rounded-full bg-avatar text-xs font-semibold text-avatar-initials ring-2 ring-section first:ml-0"
        >
          {getInitials(name)}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="-ml-1.5 flex size-7 items-center justify-center rounded-full bg-background text-xs font-semibold ring-2 ring-section">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};
