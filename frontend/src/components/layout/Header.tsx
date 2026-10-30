import { Link, NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn('py-1', isActive && 'underline decoration-2 underline-offset-8');
  const mobileLinkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-11 w-full items-center justify-center',
      isActive && 'font-semibold underline decoration-2 underline-offset-8',
    );
  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((open) => !open);

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
        <Link to="/" className="justify-self-start text-lg font-bold">
          Hand Me Down
        </Link>

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

        <div className="hidden items-center justify-self-end gap-4 text-sm font-medium md:flex">
          <NavLink to="/login" className={navLinkClassName}>
            Log in
          </NavLink>
          <Button asChild className="rounded-full px-5">
            <Link to="/register">Register</Link>
          </Button>
        </div>

        <button
          className="p-3 md:hidden"
          aria-label="Menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

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
    </header>
  );
}
