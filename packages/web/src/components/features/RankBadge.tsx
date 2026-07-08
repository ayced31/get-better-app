// ─── Rank Badge ─────────────────────────────────────────────────
import { getRank, RANKS } from '@get-better/shared';
import './RankBadge.css';

type RankBadgeSize = 'sm' | 'md' | 'lg' | 'xl';

interface RankBadgeProps {
  points?: number;
  rankName?: string;
  rankEmoji?: string;
  size?: RankBadgeSize;
  className?: string;
}

function getRankTier(rankName: string): string {
  const index = RANKS.findIndex((r) => r.name === rankName);
  if (index < 0) return 'mid';
  if (index <= 1) return 'negative';
  if (index <= 4) return 'low';
  if (index <= 8) return 'mid';
  if (index <= 11) return 'high';
  return 'elite';
}

export function RankBadge({
  points,
  rankName,
  rankEmoji,
  size = 'md',
  className = '',
}: RankBadgeProps) {
  let name = rankName;
  let emoji = rankEmoji;

  if (points !== undefined && (!name || !emoji)) {
    const rank = getRank(points);
    name = rank.name;
    emoji = rank.emoji;
  }

  if (!name) return null;

  const tier = getRankTier(name);
  const classes = [
    'rank-badge',
    `rank-badge--${tier}`,
    size !== 'md' && `rank-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {emoji && <span className="rank-badge__emoji">{emoji}</span>}
      {name}
    </span>
  );
}
