import { create } from 'zustand';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthState = {
  user: AuthUser | null;
  csrfToken: string | null;
  isCheckingSession: boolean;

  setUser: (user: AuthUser | null) => void;
  setCsrfToken: (token: string | null) => void;
  setIsCheckingSession: (checking: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  csrfToken: null,
  isCheckingSession: true,

  setUser: (user) => set({ user }),

  setCsrfToken: (token) => set({ csrfToken: token }),

  setIsCheckingSession: (checking) => set({ isCheckingSession: checking }),

  clearAuth: () =>
    set({
      user: null,
      csrfToken: null,
    }),
}));
