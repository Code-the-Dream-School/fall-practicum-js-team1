import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const isCheckingSession = useAuthStore((state) => state.isCheckingSession);

  const location = useLocation();

  if (isCheckingSession) {
    return <p className="p-6 text-center">Checking your session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
