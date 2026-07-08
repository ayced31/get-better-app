// ─── Auth Store ──────────────────────────────────────────────────
// Zustand store with persist middleware for auth state

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@get-better/shared';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      login: (token: string, user: User) => {
        set({ token, user });
      },

      logout: () => {
        set({ token: null, user: null });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'get-better-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Computed selector for convenience
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.token !== null && state.user !== null);
