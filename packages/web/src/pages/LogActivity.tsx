import { useState } from 'react';
import { useLogs, useCreateLog, useDeleteLog } from '../hooks/useLogs';
import { useAlertStore } from '../stores/alert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ActivityCard } from '../components/features/ActivityCard';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES, getISTDate } from '@get-better/shared';

type CategoryKey = 'physical' | 'diet' | 'sleep' | 'study' | 'masturbation' | 'daily_log';

export function LogActivity() {
  const today = getISTDate();
  const { data: logsData, isLoading } = useLogs(today);
  const createLog = useCreateLog();
  const deleteLog = useDeleteLog();

  const [activeTab, setActiveTab] = useState<CategoryKey>('physical');

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
      }).catch((err: any) => {
        showAlert(err.message || 'Failed to log activity', 'Error');
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container p-md flex flex-col gap-lg" style={{ marginTop: 'var(--nav-height)' }}>
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
        marginTop: 'calc(var(--nav-height) + var(--space-md))',
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
          {capStatus.hasStudied8hr && (
            <p className="text-caption text-success">
              [Bonus] Study 8 hours completed! Daily positive point cap bumped from 5 to 6 points.
            </p>
          )}
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

        {/* Masturbation Category (Escalating Penalties) */}
        {activeCategory.type === 'masturbation' && (
          <Card className="p-lg flex flex-col gap-md">
            <div>
              <h3 className="text-body" style={{ fontWeight: 600 }}>Masturbation Log</h3>
              <p className="text-caption text-tertiary" style={{ marginTop: 'var(--space-xxs)' }}>
                This resets monthly. Penalty escalates per occurrence: -3, -5, -7, -9.
                If done more than 5 times in a month, all points become 0.
              </p>
            </div>

            <div className="flex flex-col gap-sm" style={{ maxWidth: '400px' }}>
              <div className="flex justify-between items-center text-body-sm p-sm" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                <span>Times logged this month:</span>
                <strong className="text-danger">
                  {logs.filter((l) => l.category === 'masturbation').length}
                </strong>
              </div>

              <div className="flex justify-center p-sm">
                <Button
                  variant="danger"
                  fullWidth
                  loading={createLog.isPending}
                  onClick={() => {
                    if (confirm('Are you logging a masturbation slip? Points will be deducted based on monthly count.')) {
                      handleToggleLog('masturbation', 'slip', false);
                    }
                  }}
                >
                  Log Slip
                </Button>
              </div>

              {logs.filter((l) => l.category === 'masturbation').map((log, index) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-hairline)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span className="text-body-sm">Slip #{index + 1}</span>
                  <div className="flex items-center gap-sm">
                    <span className="text-danger" style={{ fontWeight: 600 }}>
                      {log.points === 0 ? 'TOTAL SCORE RESET' : `${log.points}`}
                    </span>
                    <button
                      onClick={() => handleToggleLog('masturbation', 'slip', true, log.id)}
                      className="interactive text-danger"
                      style={{ background: 'none', border: 'none', fontSize: 'var(--text-xs)' }}
                      title="Delete log"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Daily Log Category */}
        {activeCategory.type === 'daily_log' && (
          <Card className="p-lg flex flex-col gap-md">
            <div>
              <h3 className="text-body" style={{ fontWeight: 600 }}>Daily Log Streak & Penalties</h3>
              <p className="text-caption text-tertiary" style={{ marginTop: 'var(--space-xxs)' }}>
                Logging daily triggers streak bonuses: +1, +2, +3, +4 points at 7, 14, 21, 28 days respectively.
                Missing a log results in -1 points, compounding by -1 each consecutive missed day.
              </p>
            </div>

            <div className="flex flex-col gap-sm" style={{ maxWidth: '400px' }}>
              <div className="flex justify-between items-center text-body-sm p-sm" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                <span>Daily Log Penalty Status:</span>
                <span>Active</span>
              </div>
              <div className="flex justify-center p-sm">
                <Button
                  variant="danger"
                  fullWidth
                  loading={createLog.isPending}
                  onClick={() => {
                    showConfirm('Are you logging a missed log day penalty?', {
                      title: 'Log Penalty',
                      confirmLabel: 'Log Penalty',
                      onConfirm: () => {
                        handleToggleLog('daily_log', 'miss', false);
                      },
                    });
                  }}
                >
                  Log Missed Log Day
                </Button>
              </div>

              {logs.filter((l) => l.category === 'daily_log').map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center p-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-hairline)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span className="text-body-sm">Missed Day Log</span>
                  <div className="flex items-center gap-sm">
                    <span className="text-danger" style={{ fontWeight: 600 }}>
                      {log.points}
                    </span>
                    <button
                      onClick={() => handleToggleLog('daily_log', 'miss', true, log.id)}
                      className="interactive text-danger"
                      style={{ background: 'none', border: 'none', fontSize: 'var(--text-xs)' }}
                      title="Delete log"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
