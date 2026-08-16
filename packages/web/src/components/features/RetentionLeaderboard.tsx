import { useRetentionLeaderboard } from '../../hooks/useRetention';
import { useAuthStore } from '../../stores/auth';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import './RetentionLeaderboard.css';

export function RetentionLeaderboard() {
  const { data: leaderboard = [], isLoading, error } = useRetentionLeaderboard();
  const currentUser = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <Card className="p-lg flex flex-col gap-sm" style={{ width: '100%' }}>
        <div className="flex justify-between items-center mb-xs">
          <Skeleton height="20px" width="140px" />
          <Skeleton height="16px" width="80px" />
        </div>
        <div className="flex flex-col gap-xs">
          <Skeleton height="56px" />
          <Skeleton height="56px" />
          <Skeleton height="56px" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-md text-center text-danger">
        Failed to load retention leaderboard.
      </Card>
    );
  }

  return (
    <Card className="p-lg flex flex-col gap-md retention-leaderboard" style={{ width: '100%' }}>
      <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-sm)' }}>
        <div className="flex flex-col gap-xxs">
          <h3 className="text-body" style={{ fontWeight: 600 }}>
            🔥 Retention Leaderboard
          </h3>
          <span className="text-caption text-tertiary">
            Active streaks across all members
          </span>
        </div>
        <span className="text-caption text-muted">
          {leaderboard.length} {leaderboard.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div
          className="p-md text-center"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-hairline-strong)',
          }}
        >
          <p className="text-body-sm text-subtle">
            No active retention streaks recorded yet. Start your streak to claim the #1 spot!
          </p>
        </div>
      ) : (
        <div className="retention-lb-list">
          {leaderboard.map((entry) => {
            const isMe = entry.user.id === currentUser?.id;
            const rankLabel =
              entry.rank === 1 ? '🥇' :
              entry.rank === 2 ? '🥈' :
              entry.rank === 3 ? '🥉' :
              `#${entry.rank}`;

            return (
              <div
                key={entry.user.id}
                className={`retention-lb-item ${isMe ? 'retention-lb-item--current' : ''}`}
              >
                <div className="retention-lb-left">
                  <div className={`retention-lb-rank ${entry.rank <= 3 ? `retention-lb-rank--${entry.rank}` : ''}`}>
                    {rankLabel}
                  </div>
                  <div className="retention-lb-info">
                    <div className="retention-lb-name-row">
                      <span className="retention-lb-name">
                        {entry.user.displayName || entry.user.username}
                      </span>
                      {isMe && <span className="retention-lb-you-badge">You</span>}
                    </div>
                    <span className="retention-lb-subtext">
                      Best: {entry.longestStreak}d • +{entry.totalPoints} pts
                    </span>
                  </div>
                </div>

                <div className="retention-lb-right">
                  <div className="retention-lb-streak-badge">
                    <span>🔥</span>
                    <span>{entry.currentStreak} {entry.currentStreak === 1 ? 'Day' : 'Days'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
