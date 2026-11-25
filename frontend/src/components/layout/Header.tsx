import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/services/authApi';
import UserMenu from '@/components/layout/UserMenu';
import logo from '@/assets/logo.svg';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Authentication state from Zustand
  const user = useAuthStore((state) => state.user);
  const csrfToken = useAuthStore((state) => state.csrfToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isCheckingSession = useAuthStore((state) => state.isCheckingSession);

  // Navigation and TanStack Query
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const pillClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-full px-4 py-1.5 transition-colors',
      isActive
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground',
    );

  const authLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'inline-flex h-9 items-center rounded-full px-4 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground',
      isActive &&
        'text-foreground underline decoration-primary decoration-2 underline-offset-8',
    );

  const mobileLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-11 w-full items-center justify-center rounded-full transition-colors',
      isActive ? 'bg-muted font-semibold' : 'hover:bg-muted/60',
    );

  // Mobile menu handlers
  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((open) => !open);

  // Clear local authentication and return home
  const finishLogout = () => {
    clearAuth();
    queryClient.clear();
    closeMenu();
    navigate('/', { replace: true });
  };

  // Logout handler
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setLogoutError(null);

    // Missing token: clear the unusable local session.
    if (!csrfToken) {
      finishLogout();
      return;
    }

    setIsLoggingOut(true);

    try {
      // Notify backend to end the session.
      // A 401 response is treated as success by logoutUser.
      await logoutUser();

      finishLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutError('Unable to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close mobile menu when Escape is pressed
  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:py-3.5"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 justify-self-start font-brand text-xl font-extrabold tracking-tight text-brand md:text-2xl"
        >
          <img
            src={logo}
            alt=""
            className="size-10 rounded-xl shadow-sm md:size-11"
          />
          <span>
            Hand <span className="text-primary">Me</span> Down
          </span>
        </Link>

        {/* Desktop Navigation */}
        {user && (
          <div className="hidden items-center gap-1 rounded-full bg-muted p-1 text-sm font-medium md:flex">
            <NavLink to="/" end className={pillClassName}>
              Home page
            </NavLink>

            <NavLink to="/profile" className={pillClassName}>
              Profile
            </NavLink>
          </div>
        )}

        {!isCheckingSession &&
          (user ? (
            <div className="flex items-center justify-self-end gap-3 text-sm font-medium md:col-start-3">
              <Button
                asChild
                className="hidden h-9 rounded-full px-5 md:inline-flex"
              >
                <Link to="/items/new">
                  <Plus />
                  Post an item
                </Link>
              </Button>

              <UserMenu
                name={user.name}
                email={user.email}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            <>
              <div className="hidden items-center justify-self-end gap-3 text-sm font-medium md:col-start-3 md:flex">
                <NavLink to="/login" className={authLinkClassName}>
                  Log in
                </NavLink>

                <Button asChild className="h-9 rounded-full px-5">
                  <Link to="/register">Register</Link>
                </Button>
              </div>

              <button
                type="button"
                className="p-3 md:hidden"
                aria-label="Menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                onClick={toggleMenu}
              >
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </>
          ))}
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && !user && (
        <div
          id="mobile-menu"
          className="flex flex-col items-center border-t px-6 py-3 text-sm font-medium md:hidden"
        >
          <NavLink
            to="/login"
            className={mobileLinkClassName}
            onClick={closeMenu}
          >
            Log in
          </NavLink>

          <Button asChild className="mt-2 h-11 w-full rounded-full">
            <Link to="/register" onClick={closeMenu}>
              Register
            </Link>
          </Button>
        </div>
      )}

      {/* Logout Error */}
      {logoutError && (
        <p
          role="alert"
          className="mx-auto max-w-6xl px-6 pb-3 text-sm text-destructive"
        >
          {logoutError}
        </p>
      )}
    </header>
  );
}
