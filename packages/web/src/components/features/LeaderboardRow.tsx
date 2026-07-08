// ─── Leaderboard Row ────────────────────────────────────────────
import type { LeaderboardEntry } from '@get-better/shared';
import { Avatar } from '../ui/Avatar';
import { RankBadge } from './RankBadge';
import { StreakIndicator } from './StreakIndicator';
import './LeaderboardRow.css';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
  className?: string;
}

export function LeaderboardRow({
  entry,
  position,
  isCurrentUser,
  className = '',
}: LeaderboardRowProps) {
  const classes = [
    'lb-row',
    isCurrentUser && 'lb-row--current',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className={`lb-row__position lb-row__position--${position}`}>
        {position}
      </div>

      <div className="lb-row__user">
        <Avatar
          src={entry.user.avatarUrl}
          name={entry.user.displayName || entry.user.username}
          size="sm"
        />
        <span className="lb-row__name">
          {entry.user.displayName || entry.user.username}
        </span>
        <RankBadge
          rankName={entry.rank}
          rankEmoji={entry.rankEmoji}
          size="sm"
        />
      </div>

      <div className="lb-row__meta">
        <div className="lb-row__streak-wrap">
          <StreakIndicator streak={entry.streak} showLabel={false} />
        </div>
        <div className="lb-row__points">{entry.displayPoints}</div>
      </div>
    </div>
  );
}
