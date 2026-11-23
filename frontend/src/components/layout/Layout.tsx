import { Outlet } from 'react-router';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function Layout() {
  const isSignedIn = useAuthStore((state) => state.user !== null);

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen',
        isSignedIn && 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0',
      )}
    >
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileTabBar />
      <Toaster mobileOffset={{ bottom: 88 }} />
    </div>
  );
}
