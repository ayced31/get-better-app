// ─── User Stats Hooks ───────────────────────────────────────────
import { useQuery } from '@tanstack/react-query';
import type { UserStats } from '@get-better/shared';
import { api } from '../api/client';

export function useUserStats(userId?: string, month?: string) {
  return useQuery({
    queryKey: ['userStats', userId || 'me', month],
    queryFn: () => {
      const path = userId ? `/users/${userId}/stats` : '/users/me/stats';
      return api.get<UserStats>(month ? `${path}?month=${month}` : path);
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
