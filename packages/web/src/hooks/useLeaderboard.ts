// ─── Leaderboard Hooks ──────────────────────────────────────────
// React Query hooks for leaderboard data

import { useQuery } from '@tanstack/react-query';
import { getCurrentSeason, getISTDate } from '@get-better/shared';
import type { LeaderboardEntry, SeasonInfo } from '@get-better/shared';
import { api } from '../api/client';

export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'all';

export function useLeaderboard(period: LeaderboardPeriod = 'all') {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () =>
      api.get<LeaderboardEntry[]>(`/leaderboard?period=${period}`),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSeasonInfo(): SeasonInfo {
  return getCurrentSeason(getISTDate());
}
