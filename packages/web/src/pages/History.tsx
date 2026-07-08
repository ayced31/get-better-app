// ─── History Page ──────────────────────────────────────────────────
import { useState } from 'react';
import { useLogs } from '../hooks/useLogs';
import { useUserStats } from '../hooks/useUserStats';
import { Card } from '../components/ui/Card';
import { DayCalendar } from '../components/features/DayCalendar';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES, getISTDate } from '@get-better/shared';

export function History() {
  const [selectedDate, setSelectedDate] = useState(() => getISTDate());

  // Get current logs for the selected date
  const { data: logsData, isLoading: isLogsLoading } = useLogs(selectedDate);
  // Get stats to get monthly breakdown for points dot display in calendar
  const { data: stats } = useUserStats('me');

  const logs = logsData?.logs || [];
  const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'calc(var(--nav-height) + var(--space-md))',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      <div className="flex flex-col gap-xxs">
        <h1 className="text-display-lg" style={{ fontWeight: 600 }}>History</h1>
        <p className="text-body-sm text-subtle">
          View your past logs, points and categories performance. Select any past day to explore details.
        </p>
      </div>

      <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Left column: Calendar */}
        <div className="flex flex-col gap-md">
          <Card className="p-md">
            <DayCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              monthlyBreakdown={stats?.monthlyBreakdown}
            />
          </Card>
        </div>

        {/* Right column: Selected Date Logs */}
        <div className="flex flex-col gap-md">
          <div className="flex justify-between items-center">
            <h2 className="text-card-title">
              {new Date(selectedDate + 'T00:00:00Z').toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
              })}
            </h2>
            <div className="flex items-center gap-xs">
              <span className="text-caption text-muted">Daily Net:</span>
              <strong
                className="text-body-sm"
                style={{
                  color: totalPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                }}
              >
                {totalPoints >= 0 ? `+${totalPoints}` : totalPoints} Points
              </strong>
            </div>
          </div>

          <Card className="p-md flex flex-col gap-sm" style={{ minHeight: '220px' }}>
            {isLogsLoading ? (
              <div className="flex flex-col gap-xs">
                <Skeleton height="50px" />
                <Skeleton height="50px" />
                <Skeleton height="50px" />
              </div>
            ) : logs.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center text-center gap-xs"
                style={{ minHeight: '180px' }}
              >
                <p className="text-body-sm text-muted">No activities logged on this day.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-xs">
                {logs.map((log) => {
                  const catDef = CATEGORIES[log.category];
                  let activityLabel = log.activity;
                  if (catDef && catDef.type === 'standard') {
                    activityLabel =
                      catDef.activities[log.activity]?.label ||
                      catDef.penalties?.[log.activity]?.label ||
                      log.activity;
                  }

                  return (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-sm"
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
                      <span
                        className="text-body-sm"
                        style={{
                          fontWeight: 600,
                          color: log.points > 0 ? 'var(--color-success)' : log.points < 0 ? 'var(--color-danger)' : 'var(--color-ink-subtle)',
                        }}
                      >
                        {log.points > 0 ? `+${log.points}` : log.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
