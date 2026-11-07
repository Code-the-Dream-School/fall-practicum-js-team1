import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';

export default function GuestRoute() {
  const user = useAuthStore((state) => state.user);
  const isCheckingSession = useAuthStore((state) => state.isCheckingSession);

  const location = useLocation();

  if (isCheckingSession) {
    return <p className="p-6 text-center">Checking your session...</p>;
  }

  if (user) {
    // Redirect to the originally requested page, or Home.
    const from = location.state?.from?.pathname || '/';

    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
