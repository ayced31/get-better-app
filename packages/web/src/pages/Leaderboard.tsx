// ─── Leaderboard Page ──────────────────────────────────────────────
import { useState } from 'react';
import { useLeaderboard, type LeaderboardPeriod } from '../hooks/useLeaderboard';
import { useAuthStore } from '../stores/auth';
import { Card } from '../components/ui/Card';
import { LeaderboardRow } from '../components/features/LeaderboardRow';
import { Skeleton } from '../components/ui/Skeleton';
import { useUserStats } from '../hooks/useUserStats';
import { CATEGORIES } from '@get-better/shared';
import { RankBadge } from '../components/features/RankBadge';
import { StreakIndicator } from '../components/features/StreakIndicator';

function UserPointsModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: stats, isLoading } = useUserStats(userId);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex justify-between items-start p-lg" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
          <div className="flex flex-col gap-xxs">
            <h2 className="text-headline" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>
              {isLoading ? 'Loading...' : stats?.user?.displayName || stats?.user?.username}
            </h2>
            {!isLoading && stats && (
              <div className="flex items-center gap-sm mt-xs">
                <RankBadge rankName={stats.rank} rankEmoji={stats.rankEmoji} size="sm" />
                <StreakIndicator streak={stats.streak} />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="interactive text-muted hover:text-ink"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
        <div className="p-lg flex flex-col gap-xs" style={{ minHeight: '150px', width: '100%' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full" style={{ minHeight: '150px', width: '100%' }}>
              <Skeleton height="60px" width="120px" />
            </div>
          ) : (
            <div className="flex flex-col items-center" style={{ width: '100%' }}>
              <span className="text-display-lg" style={{ color: 'var(--color-primary)' }}>
                {stats?.todayPoints ?? 0}
              </span>
              <span className="text-caption text-muted uppercase tracking-wider mb-md">
                Points Today
              </span>

              <div className="flex flex-col gap-xs" style={{ marginTop: 'var(--space-sm)', width: '100%' }}>
                {stats?.todayLogs && stats.todayLogs.length > 0 ? (
                  stats.todayLogs.map(log => {
                    const catDef = CATEGORIES[log.category as keyof typeof CATEGORIES];
                    if (!catDef) return null;

                    let label = log.activity;
                    if ('activities' in catDef && log.activity in catDef.activities) {
                      label = catDef.activities[log.activity as keyof typeof catDef.activities].label;
                    } else if ('penalties' in catDef && catDef.penalties && !Array.isArray(catDef.penalties)) {
                      const penalties = catDef.penalties as Record<string, { label: string }>;
                      if (log.activity in penalties) {
                        label = penalties[log.activity].label;
                      }
                    } else if (log.category === 'masturbation') {
                      label = 'Masturbation Slip';
                    }

                    return (
                      <div key={log.id} className="flex justify-between items-center p-sm" style={{ backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', width: '100%' }}>
                        <span className="text-body-sm">{label}</span>
                        <span className={`text-body-sm ${log.points > 0 ? 'text-success' : log.points < 0 ? 'text-danger' : 'text-muted'}`} style={{ fontWeight: 600 }}>
                          {log.points > 0 ? `+${log.points}` : log.points}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-sm text-caption text-muted" style={{ backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                    No activities logged yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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
      <div className="container p-md flex flex-col gap-lg">
        <Skeleton height="50px" />
        <Skeleton height="400px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-lg text-center">
        <p className="text-danger">Failed to load leaderboard data.</p>
      </div>
    );
  }

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'var(--space-md)',
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
                  onClick={() => setSelectedUserId(entry.user.id)}
                />
              ))}
            </div>
          </div>
        )}
      </Card>
      
      {selectedUserId && (
        <UserPointsModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </div>
  );
}
