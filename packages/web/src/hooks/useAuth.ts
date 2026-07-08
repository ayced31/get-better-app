// ─── Auth Hooks ─────────────────────────────────────────────────
// React Query hooks for authentication

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, User, LoginInput, RegisterInput } from '@get-better/shared';
import { api } from '../api/client';
import { useAuthStore } from '../stores/auth';

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginInput) =>
      api.post<AuthResponse>('/auth/login', data),
    onSuccess: (data) => {
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterInput) =>
      api.post<AuthResponse>('/auth/register', data),
    onSuccess: (data) => {
      localStorage.setItem(
        'get_better_signup_info',
        JSON.stringify({
          token: data.token,
          user: data.user,
          timestamp: Date.now(),
        })
      );
      login(data.token, data.user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await api.get<User>('/auth/me');
      setUser(user);
      return user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
