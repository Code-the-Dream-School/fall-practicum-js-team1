import { cn } from '@/lib/utils';

type ProfileTabsProps = {
  tabs: { value: string; label: string; count: number }[];
  current: string;
  onChange: (value: string) => void;
};

export const ProfileTabs = ({ tabs, current, onChange }: ProfileTabsProps) => {
  return (
    <div role="tablist" className="inline-flex rounded-full bg-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          id={`tab-${tab.value}`}
          type="button"
          role="tab"
          aria-selected={tab.value === current}
          aria-controls="profile-panel"
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            tab.value === current
              ? 'bg-tab-selected'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
          <span className="rounded-full bg-background/70 px-2 text-xs">
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};
