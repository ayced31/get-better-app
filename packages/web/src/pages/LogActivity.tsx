import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useLogs, useCreateLog, useDeleteLog } from '../hooks/useLogs';
import { useAlertStore } from '../stores/alert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ActivityCard } from '../components/features/ActivityCard';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES, getISTDate, formatPointsSigned } from '@get-better/shared';
import { useRetentionStatus, useStartRetention, useLogSlip, useDeleteRetentionSlip, useUpdateRetentionSlip } from '../hooks/useRetention';
import { RetentionLeaderboard } from '../components/features/RetentionLeaderboard';

type CategoryKey = 'physical' | 'diet' | 'sleep' | 'study' | 'lifestyle' | 'retention';

export function LogActivity() {
  const today = getISTDate();
  const { data: logsData, isLoading } = useLogs(today);
  const createLog = useCreateLog();
  const deleteLog = useDeleteLog();

  const [searchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') as CategoryKey) || 'physical';
  const [activeTab, setActiveTab] = useState<CategoryKey>(initialCategory);

  const { data: retentionStatus, isLoading: isRetentionLoading } = useRetentionStatus();
  const startRetention = useStartRetention();
  const logSlip = useLogSlip();
  const deleteSlip = useDeleteRetentionSlip();
  const updateSlip = useUpdateRetentionSlip();

  const [startDateInput, setStartDateInput] = useState<string>(today);

  useEffect(() => {
    if (retentionStatus?.currentStreakStart) {
      setStartDateInput(retentionStatus.currentStreakStart);
    }
  }, [retentionStatus?.currentStreakStart]);

  const { showAlert, showConfirm } = useAlertStore();

  useEffect(() => {
    if (retentionStatus?.newlyAwardedMilestones && retentionStatus.newlyAwardedMilestones.length > 0) {
      retentionStatus.newlyAwardedMilestones.forEach((m) => {
        showAlert(`🎉 Milestone Achieved! You reached the ${m.days}-day retention milestone (+${m.points} pts)!`, 'Success');
      });
    }
  }, [retentionStatus?.newlyAwardedMilestones]);

  const handleToggleLog = (categoryKey: CategoryKey, activityKey: string, isCurrentlyLogged: boolean, logId?: string) => {
    if (isCurrentlyLogged && logId) {
      showConfirm('Are you sure you want to remove this log?', {
        title: 'Remove Log',
        confirmLabel: 'Remove',
        onConfirm: async () => {
          try {
            await deleteLog.mutateAsync(logId);
          } catch (err: any) {
            showAlert(err.message || 'Failed to remove log', 'Error');
          }
        },
      });
    } else {
      createLog.mutateAsync({
        category: categoryKey,
        activity: activityKey,
      }).then((res) => {
        if (res.streakBonus) {
          showAlert(`Bonus! You earned +${res.streakBonus.bonus} points for an awesome streak!`, 'Success');
        }
        if (res.warning) {
          showAlert(res.warning, 'Warning');
        }
      }).catch((err: any) => {
        showAlert(err.message || 'Failed to log activity', 'Error');
      });
    }
  };

  // Only block the initial page render on main logs loading, NOT on retention loading
  if (isLoading) {
    return (
      <div className="container p-md flex flex-col gap-lg">
        <Skeleton height="80px" />
        <Skeleton height="300px" />
      </div>
    );
  }

  const logs = logsData?.logs || [];
  const capStatus = logsData?.capStatus;

  // Render content according to category schema
  const activeCategory = CATEGORIES[activeTab];

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'var(--space-md)',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      <div className="flex flex-col gap-xxs">
        <h1 className="text-display-lg" style={{ fontWeight: 600 }}>Log Daily Activities</h1>
        <p className="text-body-sm text-subtle">
          Log what you did today to earn points, or log slips to track penalties. Reset at midnight IST.
        </p>
      </div>

      {/* ─── Global Points Cap Indicator ─── */}
      {capStatus && (
        <Card className="p-md flex flex-col gap-xs" style={{ backgroundColor: 'var(--color-surface-2)' }}>
          <div className="flex justify-between items-center text-body-sm">
            <span>Daily Points Cap</span>
            <span style={{ fontWeight: 600 }}>
              {capStatus.globalPositiveUsed} / {capStatus.globalPositiveCap} Points
            </span>
          </div>
          <div style={{ height: '4px', backgroundColor: 'var(--color-surface-3)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(capStatus.globalPositiveUsed / capStatus.globalPositiveCap) * 100}%`,
                backgroundColor: 'var(--color-primary)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {capStatus.globalPositiveUsed >= capStatus.globalPositiveCap && (
            <p className="text-caption text-warning">
              [Warning] Daily cap reached! Additional positive points won't count, but you can still record activities and penalties.
            </p>
          )}
          {capStatus.hasStudied8hr ? (
            <p className="text-caption text-success">
              [Bonus] Study 8 hours completed! Daily positive point cap bumped to 8 points.
            </p>
          ) : capStatus.hasStudied6hr ? (
            <p className="text-caption text-success">
              [Bonus] Study 6 hours completed! Daily positive point cap bumped to 7 points.
            </p>
          ) : null}
        </Card>
      )}

      {/* ─── Category Tabs ─── */}
      <div
        className="flex gap-xs no-scrollbar"
        style={{
          overflowX: 'auto',
          paddingBottom: 'var(--space-xs)',
          borderBottom: '1px solid var(--color-hairline)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as CategoryKey)}
            className="interactive text-button"
            style={{
              padding: 'var(--space-xs) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: activeTab === key ? 'var(--color-surface-2)' : 'transparent',
              color: activeTab === key ? 'var(--color-ink)' : 'var(--color-ink-subtle)',
              border: activeTab === key ? '1px solid var(--color-hairline-strong)' : '1px solid transparent',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="flex flex-col gap-md">
        <div className="flex justify-between items-center">
          <h2 className="text-card-title">{activeCategory.label}</h2>
          {capStatus && capStatus.categoryCaps[activeTab]?.cap && (
            <span className="text-caption text-muted">
              Cap: {capStatus.categoryCaps[activeTab].used} / {capStatus.categoryCaps[activeTab].cap}
            </span>
          )}
        </div>

        {/* Standard Category Activities/Penalties */}
        {activeCategory.type === 'standard' && (
          <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {/* Activities List */}
            {Object.keys(activeCategory.activities).length > 0 && (
              <div className="flex flex-col gap-sm">
                <h3 className="text-caption text-tertiary text-uppercase">Earn Points</h3>
                <div className="flex flex-col gap-xs">
                  {Object.entries(activeCategory.activities).map(([key, def]) => {
                    const matchedLog = logs.find((l) => l.category === activeTab && l.activity === key);
                    const isLogged = !!matchedLog;

                    return (
                      <ActivityCard
                        key={key}
                        name={def.label}
                        points={def.points}
                        isLogged={isLogged}
                        isLoading={createLog.isPending || deleteLog.isPending}
                        onClick={() => handleToggleLog(activeTab, key, isLogged, matchedLog?.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Penalties List */}
            {activeCategory.penalties && Object.keys(activeCategory.penalties).length > 0 && (
              <div className="flex flex-col gap-sm">
                <h3 className="text-caption text-tertiary text-uppercase">Penalties / Slips</h3>
                <div className="flex flex-col gap-xs">
                  {Object.entries(activeCategory.penalties).map(([key, def]) => {
                    const matchedLog = logs.find((l) => l.category === activeTab && l.activity === key);
                    const isLogged = !!matchedLog;
                    const pts = 'points' in def ? def.points : (def as any).basePoints;

                    return (
                      <ActivityCard
                        key={key}
                        name={def.label}
                        points={pts}
                        isLogged={isLogged}
                        isPenalty
                        isLoading={createLog.isPending || deleteLog.isPending}
                        onClick={() => handleToggleLog(activeTab, key, isLogged, matchedLog?.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Retention Category */}
        {activeCategory.type === 'retention' && (
          isRetentionLoading ? (
            <Skeleton height="240px" />
          ) : retentionStatus ? (
            <div
              className="grid gap-md"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                alignItems: 'start',
              }}
            >
              {/* Left Column: Retention Streak Tracker */}
              <Card className="p-lg flex flex-col gap-md" style={{ width: '100%' }}>
                <div>
                  <h3 className="text-body" style={{ fontWeight: 600 }}>Semen Retention</h3>
                  <p className="text-caption text-tertiary" style={{ marginTop: 'var(--space-xxs)' }}>
                    Set your streak start date to begin. The app automatically calculates your elapsed days and awards milestone points (every 7 days = +2 pts).
                  </p>
                </div>

                {/* Streak Overview Card (Shown if streak has started) */}
                {retentionStatus.hasStarted ? (
                  <div
                    className="flex flex-col gap-xs p-md"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      border: '1px solid var(--color-hairline-strong)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-xxs">
                        <span className="text-caption text-tertiary uppercase">Current Streak</span>
                        <span className="text-display-md text-success" style={{ fontWeight: 700 }}>
                          {retentionStatus.daysElapsed} Days
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-xxs">
                        <span className="text-caption text-tertiary">Next Goal: {retentionStatus.nextMilestoneDays} Days</span>
                        <span className="text-body-sm text-success" style={{ fontWeight: 600 }}>
                          +{retentionStatus.nextMilestonePoints} pts
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-xxs mt-xs">
                      <div className="flex justify-between text-caption text-subtle">
                        <span>Started: {retentionStatus.currentStreakStart || 'Not set'}</span>
                        <span>{retentionStatus.daysElapsed} / {retentionStatus.nextMilestoneDays} days</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--color-surface-3)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, (retentionStatus.daysElapsed / retentionStatus.nextMilestoneDays) * 100)}%`,
                            backgroundColor: 'var(--color-success)',
                            borderRadius: 'var(--radius-pill)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-md text-center"
                    style={{
                      backgroundColor: 'var(--color-surface-2)',
                      border: '1px dashed var(--color-hairline-strong)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <p className="text-body-sm text-subtle">
                      No active retention streak yet. Select your start date below and click <strong>Start</strong> to begin tracking!
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-sm">
                  <div className="flex gap-sm items-end">
                    <div className="flex flex-col flex-1 gap-xxs">
                      <label className="text-caption text-tertiary">
                        {retentionStatus.hasStarted ? 'Streak Start Date' : 'Set Start Date'}
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-hairline-strong)',
                          backgroundColor: 'var(--color-surface-1)',
                          color: 'var(--color-ink)',
                        }}
                      />
                    </div>

                    <Button
                      style={{
                        backgroundColor: 'var(--color-success)',
                        color: '#000',
                        fontWeight: 600,
                        height: '38px',
                      }}
                      loading={startRetention.isPending}
                      onClick={() => {
                        startRetention.mutate(startDateInput, {
                          onSuccess: (res: any) => {
                            const newlyAwarded = res?.data?.newlyAwardedMilestones;
                            if (newlyAwarded && newlyAwarded.length > 0) {
                              newlyAwarded.forEach((m: any) => {
                                showAlert(`🎉 Congratulations! You reached the ${m.days}-day milestone (+${m.points} pts)!`, 'Success');
                              });
                            } else {
                              showAlert('Retention streak activated!', 'Success');
                            }
                          },
                          onError: (err: any) => {
                            showAlert(err.message || 'Failed to set start date', 'Error');
                          },
                        });
                      }}
                    >
                      Start
                    </Button>

                    {retentionStatus.hasStarted && (
                      <Button
                        variant="danger"
                        style={{ height: '38px' }}
                        loading={logSlip.isPending}
                        onClick={() => {
                          showConfirm('Are you logging a masturbation slip? This will reset your start date to today (0 penalty).', {
                            title: 'Report Slip',
                            confirmLabel: 'Reset Start Date to Today',
                            onConfirm: () => {
                              logSlip.mutate(undefined, {
                                onSuccess: () => {
                                  setStartDateInput(today);
                                  showAlert('Slip logged. Your streak start date has been reset to today.', 'Warning');
                                },
                              });
                            },
                          });
                        }}
                      >
                        Slip
                      </Button>
                    )}
                  </div>
                </div>

                {/* Retention Streak Sessions History (Curated: Last Ended, Longest, 2nd Longest) */}
                {retentionStatus.hasStarted &&
                  retentionStatus.streakSessions &&
                  retentionStatus.streakSessions.filter((s) => !s.isCurrent).length > 0 && (
                    <div className="flex flex-col gap-xs mt-sm" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-md)' }}>
                      <div className="flex justify-between items-center mb-xxs">
                        <span className="text-caption text-tertiary">Notable Past Streaks</span>
                        <span className="text-caption text-muted">
                          {retentionStatus.streakSessions.filter((s) => !s.isCurrent).length}{' '}
                          {retentionStatus.streakSessions.filter((s) => !s.isCurrent).length === 1 ? 'streak' : 'streaks'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-xs">
                        {retentionStatus.streakSessions
                          .filter((s) => !s.isCurrent)
                          .map((session) => {
                            const badgeText = session.isLastEnded
                              ? session.isLongest
                                ? '🔄 Last Ended (🏆 Longest)'
                                : '🔄 Last Ended'
                              : session.isLongest
                              ? '🏆 Longest'
                              : session.isSecondLongest
                              ? '🥈 2nd Longest'
                              : 'Past Streak';

                            return (
                              <div
                                key={session.id}
                                className="flex justify-between items-center p-sm"
                                style={{
                                  backgroundColor: 'var(--color-surface-1)',
                                  border: session.isLastEnded
                                    ? '1px solid var(--color-hairline-strong)'
                                    : '1px solid var(--color-hairline)',
                                  borderRadius: 'var(--radius-md)',
                                }}
                              >
                                <div className="flex flex-col gap-xxs">
                                  <div className="flex items-center gap-xs">
                                    <span className="text-body-sm" style={{ fontWeight: 600 }}>
                                      📜 {session.maxDays} Days
                                    </span>
                                    <span
                                      className="badge text-caption"
                                      style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        backgroundColor: session.isLastEnded
                                          ? 'rgba(39, 166, 68, 0.12)'
                                          : 'var(--color-surface-3)',
                                        color: session.isLastEnded
                                          ? 'var(--color-success)'
                                          : 'var(--color-ink-subtle)',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {badgeText}
                                    </span>
                                  </div>
                                  <span className="text-caption text-tertiary">
                                    {session.startDate} {session.endDate ? `– ${session.endDate}` : '– Present'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-md">
                                  <div className="flex flex-col items-end gap-xxs">
                                    <span className="text-body-sm text-success" style={{ fontWeight: 700 }}>
                                      +{session.totalPoints} pts
                                    </span>
                                    <span className="text-caption text-muted">
                                      {session.milestonesCount} Milestones
                                    </span>
                                  </div>

                                  {session.slipLogId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      style={{ color: 'var(--color-danger)', padding: '4px 8px' }}
                                      loading={deleteSlip.isPending}
                                      onClick={() => {
                                        showConfirm('Delete this slip log? This will remove the slip record and restore your previous streak!', {
                                          title: 'Delete Slip Log',
                                          confirmLabel: 'Delete Slip',
                                          onConfirm: () => {
                                            deleteSlip.mutate(session.slipLogId!, {
                                              onSuccess: () => {
                                                showAlert('Slip log deleted and streak restored!', 'Success');
                                              },
                                            });
                                          },
                                        });
                                      }}
                                    >
                                      Delete Slip
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                {/* Past Slips Management List */}
                {retentionStatus.slips && retentionStatus.slips.length > 0 && (
                  <div className="flex flex-col gap-xs mt-sm" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-md)' }}>
                    <span className="text-caption text-tertiary mb-xs">Logged Slips Management</span>
                    <div className="flex flex-col gap-xs">
                      {retentionStatus.slips.map((slip) => (
                        <div
                          key={slip.id}
                          className="flex justify-between items-center p-xs"
                          style={{
                            backgroundColor: 'var(--color-surface-2)',
                            border: '1px solid var(--color-hairline)',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <div className="flex flex-col gap-xxs">
                            <span className="text-body-sm text-danger" style={{ fontWeight: 600 }}>Masturbation Slip</span>
                            <span className="text-caption text-tertiary">Logged Date: {slip.logDate}</span>
                          </div>

                          <div className="flex items-center gap-xs">
                            <input
                              type="date"
                              defaultValue={slip.logDate}
                              style={{
                                padding: '2px 6px',
                                fontSize: '12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-hairline-strong)',
                                backgroundColor: 'var(--color-surface-1)',
                                color: 'var(--color-ink)',
                              }}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                if (newDate && newDate !== slip.logDate) {
                                  updateSlip.mutate(
                                    { slipId: slip.id, logDate: newDate },
                                    {
                                      onSuccess: () => {
                                        showAlert('Slip date updated!', 'Success');
                                      },
                                    }
                                  );
                                }
                              }}
                            />

                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: 'var(--color-danger)', padding: '2px 6px' }}
                              loading={deleteSlip.isPending}
                              onClick={() => {
                                showConfirm(`Delete slip from ${slip.logDate}? This will restore your previous retention streak.`, {
                                  title: 'Delete Slip',
                                  confirmLabel: 'Delete',
                                  onConfirm: () => {
                                    deleteSlip.mutate(slip.id, {
                                      onSuccess: () => {
                                        showAlert('Slip deleted and retention streak restored!', 'Success');
                                      },
                                    });
                                  },
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Right Column (Desktop) / Below (Mobile): Retention Leaderboard */}
              <RetentionLeaderboard />
            </div>
          ) : (
            <Card className="p-md text-center text-muted">
              Failed to load retention status. Please try again.
            </Card>
          )
        )}
      </div>
    </div>
  );
}
