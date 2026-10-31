
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/store/authStore';

export default function GuestRoute() {
  const user = useAuthStore((state) => state.user);
  const isCheckingSession = useAuthStore(
    (state) => state.isCheckingSession,
  );

  if (isCheckingSession) {
    return <p className="p-6 text-center">Checking your session...</p>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
