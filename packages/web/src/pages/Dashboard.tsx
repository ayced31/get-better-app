// ─── Dashboard Page ───────────────────────────────────────────────
import { useNavigate } from 'react-router';
import { useUserStats } from '../hooks/useUserStats';
import { useDeleteLog } from '../hooks/useLogs';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAlertStore } from '../stores/alert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RankBadge } from '../components/features/RankBadge';
import { StreakIndicator } from '../components/features/StreakIndicator';
import { PointsDisplay } from '../components/features/PointsDisplay';
import { LeaderboardRow } from '../components/features/LeaderboardRow';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES, formatPoints, formatPointsSigned } from '@get-better/shared';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useUserStats('me');
  const { data: leaderboardEntries = [], isLoading: isLbLoading } = useLeaderboard('today');
  const deleteLog = useDeleteLog();
  const { showAlert, showConfirm } = useAlertStore();

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
      <div className="container p-md flex flex-col gap-lg">
        <Skeleton height="150px" />
        <Skeleton height="200px" />
        <Skeleton height="300px" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container p-lg text-center">
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
        marginTop: 'var(--space-md)',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      <div className="flex flex-col gap-xxs" style={{ marginBottom: 'var(--space-sm)' }}>
        <h1 className="text-display-lg" style={{ fontWeight: 600 }}>
          {getGreeting()}, {user.displayName || user.username.split(' ')[0]}
        </h1>
        <div className="flex items-center gap-xs">
          <span className="text-body-sm text-subtle">You're on a</span>
          <strong className="text-body-sm text-success" style={{ fontWeight: 600 }}>{streak} Day Streak</strong>
          <span className="text-body-sm text-subtle">🔥</span>
        </div>
      </div>

      {/* ─── Rules Card (mobile only) ─── */}
      <div className="mobile-only">
        <Card
          className="p-md flex justify-between items-center interactive"
          onClick={() => navigate('/rules')}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex items-center gap-md">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(94, 106, 210, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <p className="text-body-sm" style={{ fontWeight: 500 }}>Rules & Scoring</p>
              <p className="text-caption text-tertiary">How points are earned and lost</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Card>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Activities & Logs */}
        <div className="flex flex-col gap-xl">
          {/* Today's Coverage Widget */}
          <div className="flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h2 className="text-card-title">Today's Coverage</h2>
              <Button
                size="sm"
                variant="ghost"
                className="btn--pill-action"
                onClick={() => navigate('/log')}
                icon={
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                }
              >
                Log Activity
              </Button>
            </div>
            <div className="coverage-grid">
              {(['physical', 'diet', 'study', 'sleep'] as const).map((catKey) => {
                const catDef = CATEGORIES[catKey];
                const logsForCat = todayLogs.filter((l) => l.category === catKey);
                const positivePoints = logsForCat
                  .filter((l) => l.points > 0)
                  .reduce((sum, l) => sum + l.points, 0);
                const penaltyPoints = logsForCat
                  .filter((l) => l.points < 0)
                  .reduce((sum, l) => sum + l.points, 0);
                const hasPositive = positivePoints > 0;
                const hasPenalty = penaltyPoints < 0;
                const isEmpty = logsForCat.length === 0;

                return (
                  <div
                    key={catKey}
                    onClick={() => navigate(`/log?category=${catKey}`)}
                    className={`coverage-card ${
                      !isEmpty && hasPenalty && !hasPositive ? 'coverage-card--penalty' : 
                      !isEmpty ? 'coverage-card--logged' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-sm">
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: isEmpty
                            ? 'var(--color-surface-3)'
                            : hasPenalty && !hasPositive
                            ? 'var(--color-danger)'
                            : 'var(--color-success)',
                        }}
                      />
                      <div className="flex flex-col items-end">
                        {hasPositive && (
                          <span className="text-body-sm" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                            +{formatPoints(positivePoints)}
                          </span>
                        )}
                        {hasPenalty && (
                          <span className="text-body-sm" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                            {formatPoints(penaltyPoints)}
                          </span>
                        )}
                        {isEmpty && (
                          <span className="text-caption text-tertiary">--</span>
                        )}
                      </div>
                    </div>
                    <span className="text-body" style={{ fontWeight: 500 }}>
                      {catDef?.label || catKey}
                    </span>
                    {isEmpty && (
                      <span className="text-caption text-tertiary">No logs yet</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Timeline */}
          <div className="flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h2 className="text-card-title">Today's Timeline</h2>
              <div className="flex items-center gap-xs">
                <span className="text-caption text-muted">Points:</span>
                <span
                  className="text-body"
                  style={{
                    fontWeight: 600,
                    color: todayPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {formatPointsSigned(todayPoints)}
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
                      } else if (catDef.type === 'retention') {
                        activityLabel = log.activity === 'slip' ? 'Retention Slip' : 'Retention Milestone';
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
                            {formatPointsSigned(log.points)}
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
        </div>

        {/* Right Column: Stats & Social */}
        <div className="flex flex-col gap-xl">
          {/* Progress Card */}
          <div className="flex flex-col gap-md">
            <h2 className="text-card-title">Your Progress</h2>
            <Card className="p-md flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
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
              </div>

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'var(--color-hairline)',
                  margin: 'var(--space-xs) 0',
                }}
              />

              <div className="flex justify-between items-center">
                <PointsDisplay points={displayPoints} label="All Time Points" />
              </div>
            </Card>
          </div>

          {/* Leaderboard Widget */}
          <div className="flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h2 className="text-card-title">Leaderboard (Today)</h2>
              <Button
                size="sm"
                variant="ghost"
                className="btn--pill-action"
                onClick={() => navigate('/leaderboard')}
              >
                View Full
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
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
                      showStreak={false}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
