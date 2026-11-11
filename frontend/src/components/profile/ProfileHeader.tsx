import { getInitials } from '@/lib/getInitials';

type ProfileHeaderProps = {
  name: string;
};

export const ProfileHeader = ({ name }: ProfileHeaderProps) => {
  return (
    <div className="flex items-center gap-4">
      <span
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-avatar text-xl font-semibold text-avatar-initials lg:size-20 lg:text-2xl"
        aria-hidden="true"
      >
        {getInitials(name)}
      </span>
      <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{name}</h1>
    </div>
  );
};
