import { useRef } from 'react';
import { Link } from 'react-router';
import { Check, LogOut, MapPin, Moon } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { getInitials } from '@/lib/getInitials';
import { useThemeStore } from '@/store/themeStore';

type UserMenuProps = {
  name: string;
  email: string;
  isLoggingOut: boolean;
  onLogout: () => void;
};

const UserMenu = ({ name, email, isLoggingOut, onLogout }: UserMenuProps) => {
  const isDark = useThemeStore((state) => state.theme === 'dark');
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const usedKeyboard = useRef(false);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          onKeyDown={() => {
            usedKeyboard.current = true;
          }}
          className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground ring-1 ring-border transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted"
        >
          {getInitials(name)}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          onKeyDown={() => {
            usedKeyboard.current = true;
          }}
          onCloseAutoFocus={(event) => {
            if (!usedKeyboard.current) event.preventDefault();
            usedKeyboard.current = false;
          }}
          className="z-50 min-w-56 rounded-xl bg-popover p-1.5 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="px-3 py-2">
            <p className="font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            asChild
            className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 outline-none data-highlighted:bg-muted"
          >
            <Link to="/addresses">
              <MapPin className="size-4" />
              My addresses
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.CheckboxItem
            checked={isDark}
            onCheckedChange={toggleTheme}
            onSelect={(event) => event.preventDefault()}
            className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 outline-none data-highlighted:bg-muted"
          >
            <Moon className="size-4" />
            Dark mode
            <DropdownMenu.ItemIndicator className="ml-auto">
              <Check className="size-4" />
            </DropdownMenu.ItemIndicator>
          </DropdownMenu.CheckboxItem>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            disabled={isLoggingOut}
            onSelect={onLogout}
            className="flex cursor-default items-center gap-2 rounded-lg px-3 py-2 text-destructive outline-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-destructive/10"
          >
            <LogOut className="size-4" />
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default UserMenu;
