import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/services/authApi';

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

  // Display the user's first name
  const firstName = user?.name.split(' ')[0];

  // Navigation styling from JIRA-50
  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'py-1',
      isActive &&
        'underline decoration-nav-underline decoration-2 underline-offset-8',
    );

  const mobileLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-11 w-full items-center justify-center',
      isActive &&
        'font-semibold underline decoration-nav-underline decoration-2 underline-offset-8',
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
    <header className="border-b">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:grid md:grid-cols-[1fr_auto_1fr]"
      >
        {/* Logo */}
        <Link to="/" className="justify-self-start text-lg font-bold">
          Hand Me Down
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden gap-8 text-sm font-medium md:flex">
          <NavLink to="/" end className={navLinkClassName}>
            Home page
          </NavLink>

          <NavLink to="/items/new" className={navLinkClassName}>
            Post an item
          </NavLink>

          <NavLink to="/profile" className={navLinkClassName}>
            Profile
          </NavLink>
        </div>

        {/* Desktop Authentication */}
        <div className="hidden items-center justify-self-end gap-4 text-sm font-medium md:flex">
          {!isCheckingSession &&
            (user ? (
              <>
                <span className="font-medium">{firstName}</span>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-5"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                >
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClassName}>
                  Log in
                </NavLink>

                <Button asChild className="rounded-full px-5">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            ))}
        </div>

        {/* Mobile Menu Toggle */}
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
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="flex flex-col items-center border-t px-6 py-3 text-sm font-medium md:hidden"
        >
          <NavLink
            to="/"
            end
            className={mobileLinkClassName}
            onClick={closeMenu}
          >
            Home page
          </NavLink>

          <NavLink
            to="/items/new"
            className={mobileLinkClassName}
            onClick={closeMenu}
          >
            Post an item
          </NavLink>

          <NavLink
            to="/profile"
            className={mobileLinkClassName}
            onClick={closeMenu}
          >
            Profile
          </NavLink>

          {/* Mobile Authentication */}
          {!isCheckingSession &&
            (user ? (
              <>
                <span className="py-3 font-medium">{firstName}</span>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 h-11 w-full rounded-full"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                >
                  {isLoggingOut ? 'Logging out...' : 'Log out'}
                </Button>
              </>
            ) : (
              <>
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
              </>
            ))}
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
