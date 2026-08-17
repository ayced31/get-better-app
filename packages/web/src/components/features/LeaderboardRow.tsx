// ─── Leaderboard Row ────────────────────────────────────────────
import type { LeaderboardEntry } from '@get-better/shared';
import { formatPoints } from '@get-better/shared';
import { RankBadge } from './RankBadge';
import { StreakIndicator } from './StreakIndicator';
import './LeaderboardRow.css';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
  className?: string;
  showStreak?: boolean;
  onClick?: () => void;
}

export function LeaderboardRow({
  entry,
  position,
  isCurrentUser,
  className = '',
  showStreak = true,
  onClick,
}: LeaderboardRowProps) {
  const classes = [
    'lb-row',
    position === 1 && 'lb-row--first',
    isCurrentUser && position !== 1 && 'lb-row--current',
    onClick && 'interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} role={onClick ? "button" : undefined}>
      <div className={`lb-row__position lb-row__position--${position}`}>
        {position}
      </div>

      <div className="lb-row__user">
        <span className="lb-row__name">
          {entry.user.displayName || entry.user.username}
        </span>
        {position === 1 && (
          <span className="lb-row__moonlord" title="Moonlord">
            <span className="lb-row__moonlord-text">Moonlord</span>
            <span className="lb-row__moonlord-icon">💀</span>
          </span>
        )}
        <RankBadge
          rankName={entry.rank}
          rankEmoji={entry.rankEmoji}
          size="sm"
        />
      </div>

      <div className="lb-row__meta">
        {showStreak && (
          <div className="lb-row__streak-wrap">
            <StreakIndicator streak={entry.streak} showLabel={false} />
          </div>
        )}
        <div className="lb-row__points">{formatPoints(entry.displayPoints)}</div>
      </div>
    </div>
  );
}
