// ─── Profile Page ─────────────────────────────────────────────────
import { useParams, useNavigate } from 'react-router';
import { useUserStats } from '../hooks/useUserStats';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { RankBadge } from '../components/features/RankBadge';
import { PointsDisplay } from '../components/features/PointsDisplay';
import { Skeleton } from '../components/ui/Skeleton';

export function Profile() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useUserStats(id);

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
  } = stats;

  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'calc(var(--nav-height) + var(--space-md))',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
      }}
    >
      {/* ─── Identity Card ─── */}
      <Card className="p-lg flex flex-col gap-md">
        <div className="flex items-center gap-md">
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
            <div className="flex gap-xs items-center flex-wrap" style={{ marginTop: 'var(--space-xxs)' }}>
              <RankBadge rankName={rank} rankEmoji={rankEmoji} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/rules')}
                style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', marginLeft: 'var(--space-xs)' }}
              >
                Rules & Scoring
              </Button>
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
            <span className="text-caption text-tertiary text-uppercase">Today's Points</span>
            <span
              className="text-display-md"
              style={{
                fontWeight: 600,
                marginTop: 'var(--space-xxs)',
                color: todayPoints >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
              }}
            >
              {todayPoints >= 0 ? `+${todayPoints}` : todayPoints}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
