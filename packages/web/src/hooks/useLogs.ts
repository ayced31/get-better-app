// ─── Log Hooks ──────────────────────────────────────────────────
// React Query hooks for activity logging

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActivityLog, LogResponse, CreateLogInput, DailyCapStatus } from '@get-better/shared';
import { api } from '../api/client';

export function useLogs(date?: string) {
  return useQuery({
    queryKey: ['logs', date || 'today'],
    queryFn: () => {
      const params = date ? `?date=${date}` : '';
      return api.get<{ logs: ActivityLog[]; capStatus: DailyCapStatus }>(
        `/logs${params}`
      );
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLogInput) =>
      api.post<LogResponse>('/logs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; category?: string; activity?: string; metadata?: Record<string, unknown> }) =>
      api.patch<LogResponse>(`/logs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useDeleteLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
