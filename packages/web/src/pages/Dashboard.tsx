// ─── Dashboard Page ───────────────────────────────────────────────
import { useNavigate } from 'react-router';
import { useUserStats } from '../hooks/useUserStats';
import { useCreateLog, useDeleteLog } from '../hooks/useLogs';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAlertStore } from '../stores/alert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RankBadge } from '../components/features/RankBadge';
import { StreakIndicator } from '../components/features/StreakIndicator';
import { PointsDisplay } from '../components/features/PointsDisplay';
import { LeaderboardRow } from '../components/features/LeaderboardRow';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES } from '@get-better/shared';

export function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useUserStats('me');
  const { data: leaderboardEntries = [], isLoading: isLbLoading } = useLeaderboard('all');
  const createLog = useCreateLog();
  const deleteLog = useDeleteLog();
  const { showAlert, showConfirm } = useAlertStore();

  const handleQuickLog = async (category: string, activity: string) => {
    try {
      await createLog.mutateAsync({ category, activity });
    } catch (err: any) {
      showAlert(err.message || 'Failed to log activity', 'Error');
    }
  };

  const handleDeleteLog = (id: string) => {
    showConfirm('Are you sure you want to delete this log?', {
      title: 'Delete Log',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteLog.mutateAsync(id);
        } catch (err: any) {
          showAlert(err.message || 'Failed to delete log', 'Error');
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container p-md flex flex-col gap-lg" style={{ marginTop: 'var(--nav-height)' }}>
        <Skeleton height="150px" />
        <Skeleton height="200px" />
        <Skeleton height="300px" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container p-lg text-center" style={{ marginTop: 'var(--nav-height)' }}>
        <p className="text-danger">Failed to load dashboard data. Please try again later.</p>
      </div>
    );
  }

  const {
    user,
    displayPoints,
    rank,
    rankEmoji,
    rankProgress,
    nextRank,
    streak,
    todayPoints,
    todayLogs,
  } = stats;

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'calc(var(--nav-height) + var(--space-md))',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      {/* ─── Hero Row ─── */}
      <div className="flex justify-between items-center flex-wrap gap-md">
        <div>
          <h1 className="text-display-lg" style={{ fontWeight: 600 }}>
            Hey, {user.displayName || user.username}
          </h1>
          <p className="text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            Let's get better today. One log at a time.
          </p>
        </div>
        <div className="flex gap-md items-center">
          <StreakIndicator streak={streak} />
          <PointsDisplay points={displayPoints} label="All Time Points" />
        </div>
      </div>

      {/* ─── Progress to Next Rank ─── */}
      <Card className="p-md flex flex-col gap-xs">
        <div className="flex justify-between items-center text-body-sm">
          <span className="flex items-center gap-xs">
            Rank: <RankBadge rankName={rank} rankEmoji={rankEmoji} />
          </span>
          {nextRank ? (
            <span className="text-subtle">
              Next: <strong className="text-ink">{nextRank}</strong>
            </span>
          ) : (
            <span className="text-success" style={{ fontWeight: 600 }}>
              Max Rank Achieved!
            </span>
          )}
        </div>
        <div
          style={{
            height: '8px',
            backgroundColor: 'var(--color-surface-3)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${rankProgress}%`,
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
        <div className="flex justify-between text-caption text-tertiary">
          <span>Progress</span>
          <span>{Math.round(rankProgress)}%</span>
        </div>
      </Card>

      {/* ─── Today's Logs and Actions ─── */}
      <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Left column: Quick Log Shortcuts */}
        <div className="flex flex-col gap-md">
          <h2 className="text-card-title">Quick Actions</h2>
          <Card className="p-md flex flex-col gap-sm">
            <p className="text-caption text-tertiary text-uppercase">
              Common Activity Logs
            </p>
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center">
                <span className="text-body-sm">Gym Session</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleQuickLog('physical', 'gym')}
                  loading={createLog.isPending}
                >
                  +1 Point
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm">10k Steps</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleQuickLog('physical', 'steps_10k')}
                  loading={createLog.isPending}
                >
                  +1 Point
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm">No Junk Diet</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleQuickLog('diet', 'no_junk')}
                  loading={createLog.isPending}
                >
                  +1 Point
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm">Study 2 Hours</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleQuickLog('study', 'study_2hr')}
                  loading={createLog.isPending}
                >
                  +1 Point
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-body-sm">Doomscrolling &gt;2hr</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleQuickLog('sleep', 'doomscrolling')}
                  loading={createLog.isPending}
                >
                  -2 Points
                </Button>
              </div>
            </div>
            <Button
              variant="primary"
              fullWidth
              style={{ marginTop: 'var(--space-xs)' }}
              onClick={() => navigate('/log')}
            >
              Log Full Activity
            </Button>
          </Card>
        </div>

        {/* Right column: Today's Logs */}
        <div className="flex flex-col gap-md">
          <div className="flex justify-between items-center">
            <h2 className="text-card-title">Today's Timeline</h2>
            <div className="flex items-center gap-xs">
              <span className="text-caption text-muted">Today's Points:</span>
              <span
                className="text-body"
                style={{
                  fontWeight: 600,
                  color: todayPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {todayPoints >= 0 ? `+${todayPoints}` : todayPoints}
              </span>
            </div>
          </div>

          <Card className="p-md flex flex-col gap-sm" style={{ minHeight: '200px' }}>
            {todayLogs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center text-center gap-xs"
                style={{ height: '100%', minHeight: '180px' }}
              >
                <p className="text-body-sm text-muted">Nothing logged today yet.</p>
                <p className="text-caption text-tertiary">
                  Hit the Gym, complete steps or sleep on time to start tracking points.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-xs">
                {todayLogs.map((log) => {
                  const isPositive = log.points > 0;
                  const isPenalty = log.points < 0;

                  // Find human-friendly activity label
                  const catDef = CATEGORIES[log.category];
                  let activityLabel = log.activity;
                  if (catDef) {
                    if (catDef.type === 'standard') {
                      activityLabel =
                        catDef.activities[log.activity]?.label ||
                        catDef.penalties?.[log.activity]?.label ||
                        log.activity;
                    } else if (catDef.type === 'masturbation') {
                      activityLabel = 'Masturbation Penalty';
                    } else if (catDef.type === 'daily_log') {
                      activityLabel = 'Daily Log Penalty';
                    }
                  }

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        border: '1px solid var(--color-hairline)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-body-sm" style={{ fontWeight: 500 }}>
                          {activityLabel}
                        </span>
                        <span className="text-caption text-tertiary">
                          {catDef?.label || log.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-md">
                        <span
                          className="text-body-sm"
                          style={{
                            fontWeight: 600,
                            color: isPositive
                              ? 'var(--color-success)'
                              : isPenalty
                              ? 'var(--color-danger)'
                              : 'var(--color-ink-subtle)',
                          }}
                        >
                          {log.points > 0 ? `+${log.points}` : log.points}
                        </span>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="interactive text-danger hover:opacity-80"
                          style={{ background: 'none', border: 'none', padding: 'var(--space-xxs)', fontSize: 'var(--text-xs)' }}
                          title="Delete log"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Third column: Leaderboard Peek */}
        <div className="flex flex-col gap-md">
          <div className="flex justify-between items-center">
            <h2 className="text-card-title">Leaderboard Peek</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/leaderboard')}
              style={{ padding: '0 var(--space-xs)' }}
            >
              View Full
            </Button>
          </div>
          <Card className="p-md flex flex-col gap-sm" style={{ minHeight: '200px' }}>
            {isLbLoading ? (
              <div className="flex flex-col gap-xs">
                <Skeleton height="40px" />
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </div>
            ) : leaderboardEntries.length === 0 ? (
              <p className="text-body-sm text-muted text-center p-md">No entries yet.</p>
            ) : (
              <div className="flex flex-col">
                {leaderboardEntries.slice(0, 4).map((entry, index) => (
                  <LeaderboardRow
                    key={entry.user.id}
                    entry={entry}
                    position={index + 1}
                    isCurrentUser={entry.user.id === stats?.user?.id}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
