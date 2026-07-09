// ─── History Page ──────────────────────────────────────────────────
import { useState } from 'react';
import { useLogs, useDeleteLog } from '../hooks/useLogs';
import { useUserStats } from '../hooks/useUserStats';
import { useAlertStore } from '../stores/alert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES, getISTDate } from '@get-better/shared';

export function History() {
  const today = getISTDate();
  const [selectedDate, setSelectedDate] = useState(() => today);

  // Current Month State (YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: logsData, isLoading: isLogsLoading } = useLogs(selectedDate);
  const { data: stats } = useUserStats('me', currentMonth);

  const logs = logsData?.logs || [];
  const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);

  const monthlyBreakdown = stats?.monthlyBreakdown ?? [];
  const monthlyStats = stats?.monthlyStats ?? {
    workoutCount: 0,
    studyHours: 0,
    slipsCount: 0,
    missesCount: 0,
    lateSleepCount: 0,
  };
  const totalMonthlyPoints = monthlyBreakdown.reduce((sum, item) => sum + item.points, 0);

  // Month navigation
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setCurrentMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    setCurrentMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const getMonthLabel = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    });
  };

  // Calendar cells for heatmap
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const calendarCells: { dateKey: string; dayNum: number; points: number | null }[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ dateKey: `empty-${i}`, dayNum: 0, points: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `${currentMonth}-${dayStr}`;
    const dayData = monthlyBreakdown.find((item) => item.date === dateKey);
    calendarCells.push({ dateKey, dayNum: d, points: dayData ? dayData.points : 0 });
  }

  const getCellColor = (points: number | null, isSelected: boolean) => {
    if (points === null) return 'transparent';
    if (isSelected) return 'var(--color-primary)';
    if (points === 0) return 'var(--color-surface-3)';
    if (points > 0) {
      if (points === 1) return 'rgba(94, 106, 210, 0.15)';
      if (points === 2) return 'rgba(94, 106, 210, 0.35)';
      if (points <= 4) return 'rgba(94, 106, 210, 0.65)';
      return 'var(--color-primary)';
    }
    if (points === -1 || points === -2) return 'rgba(239, 68, 68, 0.15)';
    if (points === -3 || points === -4) return 'rgba(239, 68, 68, 0.4)';
    return 'var(--color-danger)';
  };

  const deleteLog = useDeleteLog();
  const { showAlert, showConfirm } = useAlertStore();

  const handleDeleteLog = (id: string) => {
    showConfirm('Are you sure you want to delete this log entry?', {
      title: 'Delete History Entry',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteLog.mutateAsync(id);
        } catch (err: any) {
          showAlert(err.message || 'Failed to delete log entry', 'Error');
        }
      },
    });
  };

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'var(--space-md)',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      <div className="flex flex-col gap-xxs">
        <h1 className="text-display-lg" style={{ fontWeight: 600 }}>History</h1>
        <p className="text-body-sm text-subtle">
          Browse your monthly contributions and tap any day to see its logs.
        </p>
      </div>

      {/* ─── Monthly Contributions Heatmap + Day Detail ─── */}
      <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

        {/* Left: Heatmap (replaces plain DayCalendar) */}
        <Card className="p-md flex flex-col gap-md">
          {/* Month header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-card-title">Monthly Contributions</h2>
              <p className="text-caption text-tertiary" style={{ marginTop: 'var(--space-xxs)' }}>
                Tap a day to view its logs
              </p>
            </div>
            <div className="flex items-center gap-xs">
              <Button variant="secondary" size="sm" onClick={handlePrevMonth} style={{ padding: '4px 10px' }}>
                &lt;
              </Button>
              <span className="text-body-sm" style={{ fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>
                {getMonthLabel()}
              </span>
              <Button variant="secondary" size="sm" onClick={handleNextMonth} style={{ padding: '4px 10px' }}>
                &gt;
              </Button>
            </div>
          </div>

          {/* Day-of-week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-caption text-tertiary" style={{ fontSize: '11px', fontWeight: 600 }}>
                {d}
              </span>
            ))}
          </div>

          {/* Grid cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarCells.map((cell) => {
              const hasData = cell.dayNum > 0;
              const isSelected = cell.dateKey === selectedDate;
              const isFuture = hasData && cell.dateKey > today;
              const cellColor = getCellColor(cell.points, isSelected);

              return (
                <div
                  key={cell.dateKey}
                  title={hasData ? `${cell.dateKey}: ${cell.points !== null && cell.points >= 0 ? '+' : ''}${cell.points} pts` : undefined}
                  onClick={() => hasData && !isFuture && setSelectedDate(cell.dateKey)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: cellColor,
                    border: isSelected
                      ? '2px solid var(--color-primary)'
                      : cell.dayNum > 0
                      ? '1px solid var(--color-hairline)'
                      : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    cursor: hasData && !isFuture ? 'pointer' : 'default',
                    opacity: isFuture ? 0.3 : 1,
                  }}
                  className={hasData && !isFuture ? 'interactive' : ''}
                >
                  {cell.dayNum > 0 && (
                    <span
                      className="text-caption"
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        opacity: isSelected ? 1 : 0.7,
                        color: isSelected ? '#fff' : undefined,
                      }}
                    >
                      {cell.dayNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-end items-center gap-sm text-caption text-tertiary">
            <span>Slips</span>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--color-danger)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--color-surface-3)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(94, 106, 210, 0.35)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--color-primary)' }} />
            <span>Sigma</span>
          </div>
        </Card>

        {/* Right: Selected date logs */}
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
                style={{ color: totalPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {totalPoints >= 0 ? `+${totalPoints}` : totalPoints} pts
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
              <div className="flex flex-col items-center justify-center text-center gap-xs" style={{ minHeight: '180px' }}>
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
                        <span className="text-body-sm" style={{ fontWeight: 500 }}>{activityLabel}</span>
                        <span className="text-caption text-tertiary">{catDef?.label || log.category}</span>
                      </div>
                      <div className="flex items-center gap-md">
                        <span
                          className="text-body-sm"
                          style={{
                            fontWeight: 600,
                            color: log.points > 0 ? 'var(--color-success)' : log.points < 0 ? 'var(--color-danger)' : 'var(--color-ink-subtle)',
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
      </div>

      {/* ─── Monthly Breakdown Summary ─── */}
      <div className="flex justify-between items-center">
        <h2 className="text-card-title">Monthly Breakdown</h2>
        <span
          className="text-body-sm"
          style={{ fontWeight: 600, color: totalMonthlyPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
        >
          {totalMonthlyPoints >= 0 ? `+${totalMonthlyPoints}` : totalMonthlyPoints} pts net
        </span>
      </div>

      <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Card className="p-md flex flex-col gap-xxs">
          <span className="text-caption text-tertiary text-uppercase">Workouts Completed</span>
          <span className="text-display-sm" style={{ fontWeight: 600 }}>{monthlyStats.workoutCount}</span>
          <span className="text-caption text-muted">Gym, Steps & Yoga sessions</span>
        </Card>
        <Card className="p-md flex flex-col gap-xxs">
          <span className="text-caption text-tertiary text-uppercase">Study Log Hours</span>
          <span className="text-display-sm" style={{ fontWeight: 600 }}>{monthlyStats.studyHours}h</span>
          <span className="text-caption text-muted">Total dedicated study time</span>
        </Card>
        <Card className="p-md flex flex-col gap-xxs">
          <span className="text-caption text-tertiary text-uppercase">Masturbation Slips</span>
          <span className="text-display-sm text-danger" style={{ fontWeight: 600 }}>{monthlyStats.slipsCount}</span>
          <span className="text-caption text-muted">Resets after 5 occurrences</span>
        </Card>
        <Card className="p-md flex flex-col gap-xxs">
          <span className="text-caption text-tertiary text-uppercase">Late Sleeping Days</span>
          <span className="text-display-sm text-warning" style={{ fontWeight: 600 }}>{monthlyStats.lateSleepCount}</span>
          <span className="text-caption text-muted">Days slept past 12:00 midnight</span>
        </Card>
        <Card className="p-md flex flex-col gap-xxs">
          <span className="text-caption text-tertiary text-uppercase">Missed Log Days</span>
          <span className="text-display-sm text-danger" style={{ fontWeight: 600 }}>{monthlyStats.missesCount}</span>
          <span className="text-caption text-muted">Auto-inserted log miss penalties</span>
        </Card>
      </div>
    </div>
  );
}
