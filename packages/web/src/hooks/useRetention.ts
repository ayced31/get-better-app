import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RetentionStatus } from '@get-better/shared';
import { api } from '../api/client';

export function useRetentionStatus() {
  return useQuery({
    queryKey: ['retention'],
    queryFn: () => api.get<RetentionStatus>('/retention/status'),
    staleTime: 30 * 1000,
  });
}

export function useStartRetention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (startDate?: string) => api.post<RetentionStatus>('/retention/start', { startDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}

export function useClaimMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<RetentionStatus>('/retention/claim'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}

export function useLogSlip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<RetentionStatus>('/retention/slip'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}
