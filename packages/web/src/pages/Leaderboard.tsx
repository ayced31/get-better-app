// ─── Leaderboard Page ──────────────────────────────────────────────
import { useState } from 'react';
import { useLeaderboard, type LeaderboardPeriod } from '../hooks/useLeaderboard';
import { useAuthStore } from '../stores/auth';
import { Card } from '../components/ui/Card';
import { LeaderboardRow } from '../components/features/LeaderboardRow';
import { Skeleton } from '../components/ui/Skeleton';

export function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const { data: entries = [], isLoading, error } = useLeaderboard(period);
  const currentUser = useAuthStore((s) => s.user);

  const periods: { value: LeaderboardPeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'all', label: 'All Time' },
  ];

  if (isLoading) {
    return (
      <div className="container p-md flex flex-col gap-lg" style={{ marginTop: 'var(--nav-height)' }}>
        <Skeleton height="50px" />
        <Skeleton height="400px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-lg text-center" style={{ marginTop: 'var(--nav-height)' }}>
        <p className="text-danger">Failed to load leaderboard data.</p>
      </div>
    );
  }

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'calc(var(--nav-height) + var(--space-md))',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      <div className="flex flex-col gap-xxs">
        <h1 className="text-display-lg" style={{ fontWeight: 600 }}>Leaderboard</h1>
        <p className="text-body-sm text-subtle">
          Compete with your close friends. The board for 'Today' resets at midnight IST.
        </p>
      </div>

      {/* ─── Period Selector Tabs ─── */}
      <div
        className="flex gap-xs"
        style={{
          borderBottom: '1px solid var(--color-hairline)',
          paddingBottom: 'var(--space-xs)',
        }}
      >
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className="interactive text-button"
            style={{
              padding: 'var(--space-xs) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: period === p.value ? 'var(--color-surface-2)' : 'transparent',
              color: period === p.value ? 'var(--color-ink)' : 'var(--color-ink-subtle)',
              border: period === p.value ? '1px solid var(--color-hairline-strong)' : '1px solid transparent',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ─── Leaderboard List ─── */}
      <Card className="p-md flex flex-col gap-xs" style={{ minHeight: '300px' }}>
        {entries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center gap-xs"
            style={{ minHeight: '260px' }}
          >
            <p className="text-body-sm text-muted">No points logged for this period.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header labels */}
            <div
              className="flex justify-between items-center text-caption text-tertiary p-xs"
              style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-xs)' }}
            >
              <div className="flex items-center gap-md">
                <span style={{ width: '28px', textAlign: 'center' }}>Pos</span>
                <span>User</span>
              </div>
              <div className="flex items-center gap-lg">
                <span style={{ width: '40px', textAlign: 'center' }}>Streak</span>
                <span style={{ width: '60px', textAlign: 'right' }}>Points</span>
              </div>
            </div>

            {/* Rows */}
            <div className="flex flex-col" style={{ marginTop: 'var(--space-xs)' }}>
              {entries.map((entry, index) => (
                <LeaderboardRow
                  key={entry.user.id}
                  entry={entry}
                  position={index + 1}
                  isCurrentUser={entry.user.id === currentUser?.id}
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
