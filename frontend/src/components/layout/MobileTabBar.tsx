import { House, Plus, User } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const tabs = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/items/new', label: 'Post an item', icon: Plus, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
];

const MobileTabBar = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-3">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors',
                  isActive
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-14 items-center justify-center rounded-full transition-colors',
                      to === '/items/new'
                        ? 'bg-primary text-primary-foreground'
                        : isActive && 'bg-muted',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileTabBar;
