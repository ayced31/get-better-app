// ─── Activity Card ──────────────────────────────────────────────
import './ActivityCard.css';

interface ActivityCardProps {
  name: string;
  points: number;
  isLogged: boolean;
  isPenalty?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ActivityCard({
  name,
  points,
  isLogged,
  isPenalty = false,
  isLoading = false,
  onClick,
  className = '',
}: ActivityCardProps) {
  const classes = [
    'activity-card',
    isLogged && 'activity-card--logged',
    isPenalty && 'activity-card--penalty',
    isLoading && 'activity-card--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const pointsClass =
    points > 0 ? 'activity-card__points--positive' : 'activity-card__points--negative';

  return (
    <div
      className={classes}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-pressed={isLogged}
    >
      <div className="activity-card__left">
        <div className="activity-card__check">
          {isLogged ? '✓' : ''}
        </div>
        <span className="activity-card__name">{name}</span>
      </div>
      <div className="activity-card__right">
        <span className={`activity-card__points ${pointsClass}`}>
          {points > 0 ? `+${points}` : points}
        </span>
      </div>
    </div>
  );
}
