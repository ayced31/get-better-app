import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLogs, useCreateLog, useDeleteLog } from '../hooks/useLogs';
import { useAlertStore } from '../stores/alert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ActivityCard } from '../components/features/ActivityCard';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES, getISTDate, formatPointsSigned } from '@get-better/shared';
import { useRetentionStatus, useClaimMilestone, useLogSlip } from '../hooks/useRetention';

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
  const claimMilestone = useClaimMilestone();
  const logSlip = useLogSlip();

  const { showAlert, showConfirm } = useAlertStore();

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
            <Skeleton height="200px" />
          ) : retentionStatus ? (
            <Card className="p-lg flex flex-col gap-md" style={{ maxWidth: '500px' }}>
              <div>
                <h3 className="text-body" style={{ fontWeight: 600 }}>Semen Retention</h3>
                <p className="text-caption text-tertiary" style={{ marginTop: 'var(--space-xxs)' }}>
                  Achieve retention milestones to earn positive points added directly to your total. Logging a slip resets your target to Stage 1 (0 penalty).
                </p>
              </div>

              {/* Target Stage Card */}
              <div
                className="flex justify-between items-center p-md"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-hairline-strong)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="flex flex-col gap-xxs">
                  <span className="text-caption text-tertiary uppercase">Active Target Stage</span>
                  <span className="text-body" style={{ fontWeight: 600 }}>
                    {retentionStatus.currentStageDays} Days Goal
                  </span>
                </div>
                <span className="text-display-md text-success" style={{ fontWeight: 700 }}>
                  +{retentionStatus.currentStagePoints} pts
                </span>
              </div>

              <div className="flex gap-sm">
                <Button
                  variant="primary"
                  fullWidth
                  loading={claimMilestone.isPending}
                  onClick={() => {
                    claimMilestone.mutate(undefined, {
                      onSuccess: () => {
                        showAlert(`Congratulations! You logged ${retentionStatus.currentStageDays} Days Retention (+${retentionStatus.currentStagePoints} pts)!`, 'Success');
                      },
                    });
                  }}
                >
                  Log {retentionStatus.currentStageDays} Days Achieved
                </Button>

                <Button
                  variant="secondary"
                  fullWidth
                  loading={logSlip.isPending}
                  onClick={() => {
                    showConfirm('Are you logging a masturbation slip? This will reset your active target stage back to 7 Days (0 penalty).', {
                      title: 'Masturbation Slip',
                      confirmLabel: 'Reset Stage to 7 Days',
                      onConfirm: () => logSlip.mutate(),
                    });
                  }}
                >
                  Masturbation Slip
                </Button>
              </div>

              {retentionStatus.claimedMilestones && retentionStatus.claimedMilestones.length > 0 && (
                <div className="flex flex-col gap-xs mt-sm" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-md)' }}>
                  <span className="text-caption text-tertiary mb-xs">Achieved Milestones History</span>
                  {retentionStatus.claimedMilestones.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-xs"
                      style={{
                        backgroundColor: 'var(--color-surface-2)',
                        border: '1px solid var(--color-hairline)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <span className="text-body-sm">{entry.days} Days Milestone</span>
                      <span className="text-success" style={{ fontWeight: 600 }}>
                        {formatPointsSigned(entry.points)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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
