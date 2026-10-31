
import { useEffect, type ReactNode } from 'react';
import { getCurrentUser } from '@/services/authApi';
import { useAuthStore } from '@/store/authStore';

type AuthInitializerProps = {
  children: ReactNode;
};

export default function AuthInitializer({
  children,
}: AuthInitializerProps) {
  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const result = await getCurrentUser();

        if (!active) return;

        if (result) {
          useAuthStore.getState().setUser(result.user);
          useAuthStore.getState().setCsrfToken(result.csrfToken);
        } else {
          useAuthStore.getState().clearAuth();
        }
      } catch (error) {
        if (active) {
          console.error('Session check failed:', error);
          useAuthStore.getState().clearAuth();
        }
      } finally {
        if (active) {
          useAuthStore.getState().setIsCheckingSession(false);
        }
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}
