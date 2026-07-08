// ─── Profile Page ─────────────────────────────────────────────────
import { useState } from 'react';
import { useParams } from 'react-router';
import { useUserStats } from '../hooks/useUserStats';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { RankBadge } from '../components/features/RankBadge';
import { PointsDisplay } from '../components/features/PointsDisplay';
import { Skeleton } from '../components/ui/Skeleton';
import { CATEGORIES } from '@get-better/shared';

export function Profile() {
  const { id } = useParams<{ id?: string }>();

  // Current Month State (YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: stats, isLoading, error } = useUserStats(id, currentMonth);

  // Month-wise scrolling
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

  // Human friendly month label (e.g. "July 2026")
  const getMonthLabel = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
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
        <p className="text-danger">Failed to load user profile.</p>
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
    monthlyBreakdown = [],
    monthlyStats = {
      workoutCount: 0,
      studyHours: 0,
      slipsCount: 0,
      missesCount: 0,
      lateSleepCount: 0,
    },
  } = stats;

  const totalMonthlyPoints = monthlyBreakdown.reduce((sum, item) => sum + item.points, 0);

  // Calculate Calendar Days for Heat Map Grid
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...

  // Prepare list of days to render
  const calendarCells: { dateKey: string; dayNum: number; points: number | null }[] = [];
  
  // Fill empty start spaces
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push({ dateKey: `empty-${i}`, dayNum: 0, points: null });
  }

  // Fill actual month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `${currentMonth}-${dayStr}`;
    const dayData = monthlyBreakdown.find((item) => item.date === dateKey);
    calendarCells.push({
      dateKey,
      dayNum: d,
      points: dayData ? dayData.points : 0,
    });
  }

  // Get Heat Map Cell Color based on points
  const getCellColor = (points: number | null) => {
    if (points === null) return 'transparent'; // empty slots
    if (points === 0) return 'var(--color-surface-3)'; // logged 0 points or no logs yet
    if (points > 0) {
      if (points === 1) return 'rgba(94, 106, 210, 0.15)';
      if (points === 2) return 'rgba(94, 106, 210, 0.35)';
      if (points <= 4) return 'rgba(94, 106, 210, 0.65)';
      return 'var(--color-primary)'; // 5+ points
    }
    // Net negative days
    if (points === -1 || points === -2) return 'rgba(239, 68, 68, 0.15)';
    if (points === -3 || points === -4) return 'rgba(239, 68, 68, 0.4)';
    return 'var(--color-danger)';
  };

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'calc(var(--nav-height) + var(--space-md))',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      {/* ─── Profile Header ─── */}
      <Card className="p-lg flex flex-col gap-md">
        <div className="flex items-center gap-md flex-wrap">
          <Avatar
            src={user.avatarUrl}
            name={user.displayName || user.username}
            size="lg"
          />
          <div className="flex flex-col gap-xxs">
            <h1 className="text-headline" style={{ fontWeight: 600 }}>
              {user.displayName || user.username}
            </h1>
            <p className="text-caption text-tertiary">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-xs items-center" style={{ marginTop: 'var(--space-xxs)' }}>
              <RankBadge rankName={rank} rankEmoji={rankEmoji} />
            </div>
          </div>
        </div>

        {/* Rank Progress */}
        <div className="flex flex-col gap-xxs" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: 'var(--space-md)' }}>
          <div className="flex justify-between items-center text-body-sm">
            <span className="text-muted">Rank Progress</span>
            {nextRank ? (
              <span className="text-subtle">
                Next Rank: <strong className="text-ink">{nextRank}</strong>
              </span>
            ) : (
              <span className="text-success" style={{ fontWeight: 600 }}>Max Rank</span>
            )}
          </div>
          <div style={{ height: '8px', backgroundColor: 'var(--color-surface-3)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${rankProgress}%`,
                backgroundColor: 'var(--color-primary)',
                borderRadius: 'var(--radius-pill)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </Card>

      {/* ─── Core Stat Grid ─── */}
      <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Card className="p-md flex items-center justify-between">
          <PointsDisplay points={displayPoints} label="All Time Score" />
        </Card>
        <Card className="p-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-caption text-tertiary text-uppercase">Current Streak</span>
            <span className="text-display-md flex items-center gap-xs" style={{ fontWeight: 600, marginTop: 'var(--space-xxs)' }}>
              {streak} Days
            </span>
          </div>
        </Card>
        <Card className="p-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-caption text-tertiary text-uppercase">Month Net Score</span>
            <span
              className="text-display-md"
              style={{
                fontWeight: 600,
                marginTop: 'var(--space-xxs)',
                color: totalMonthlyPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              }}
            >
              {totalMonthlyPoints >= 0 ? `+${totalMonthlyPoints}` : totalMonthlyPoints}
            </span>
          </div>
        </Card>
      </div>

      {/* ─── GitHub-style Contributions Heat Map & Scrolling ─── */}
      <Card className="p-lg flex flex-col gap-lg">
        <div className="flex justify-between items-center flex-wrap gap-sm" style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-sm)' }}>
          <div>
            <h2 className="text-card-title">Monthly Contributions</h2>
            <p className="text-caption text-tertiary" style={{ marginTop: 'var(--space-xxs)' }}>
              Purple represents positive points, red represents net negative slips/misses.
            </p>
          </div>
          {/* Month Wise Scroller */}
          <div className="flex items-center gap-sm">
            <Button variant="secondary" size="sm" onClick={handlePrevMonth} style={{ padding: '4px 10px' }}>
              &lt;
            </Button>
            <span className="text-body-sm" style={{ fontWeight: 600, minWidth: '110px', textAlign: 'center' }}>
              {getMonthLabel()}
            </span>
            <Button variant="secondary" size="sm" onClick={handleNextMonth} style={{ padding: '4px 10px' }}>
              &gt;
            </Button>
          </div>
        </div>

        {/* Heat Map Grid */}
        <div className="flex flex-col gap-md">
          {/* Calendar Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-caption text-tertiary" style={{ fontSize: '11px', fontWeight: 600 }}>
                {d}
              </span>
            ))}
          </div>

          {/* Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarCells.map((cell) => {
              const hasData = cell.dayNum > 0;
              const cellColor = getCellColor(cell.points);

              return (
                <div
                  key={cell.dateKey}
                  title={hasData ? `${cell.dateKey}: ${cell.points !== null && cell.points >= 0 ? '+' : ''}${cell.points} points` : undefined}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: cellColor,
                    border: cell.dayNum > 0 ? '1px solid var(--color-hairline)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    cursor: hasData ? 'pointer' : 'default',
                  }}
                  className={hasData ? 'interactive hover:opacity-80' : ''}
                >
                  {cell.dayNum > 0 && (
                    <span className="text-caption" style={{ fontSize: '10px', fontWeight: 600, opacity: 0.7 }}>
                      {cell.dayNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-end items-center gap-sm text-caption text-tertiary" style={{ marginTop: 'var(--space-xxs)' }}>
            <span>Slips</span>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--color-danger)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--color-surface-3)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'rgba(94, 106, 210, 0.35)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--color-primary)' }} />
            <span>Sigma</span>
          </div>
        </div>
      </Card>

      {/* ─── Detailed Monthly Metrics Summary Cards ─── */}
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

      {/* ─── Today's Logs ─── */}
      <Card className="p-lg flex flex-col gap-md">
        <h2 className="text-card-title">Today's Logs</h2>
        {todayLogs.length === 0 ? (
          <p className="text-body-sm text-muted">No logs recorded today.</p>
        ) : (
          <div className="flex flex-col gap-xs">
            {todayLogs.map((log) => {
              const catDef = CATEGORIES[log.category];
              let activityLabel = log.activity;
              if (catDef && catDef.type === 'standard') {
                activityLabel = catDef.activities[log.activity]?.label || log.activity;
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
  );
}
