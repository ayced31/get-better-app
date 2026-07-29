// ─── Points Display ─────────────────────────────────────────────
import { formatPoints } from '@get-better/shared';
import './PointsDisplay.css';

type PointsSize = 'sm' | 'md' | 'lg' | 'xl';

interface PointsDisplayProps {
  points: number;
  label?: string;
  size?: PointsSize;
  showSign?: boolean;
  animated?: boolean;
  className?: string;
}

export function PointsDisplay({
  points,
  label,
  size = 'md',
  showSign = false,
  animated = true,
  className = '',
}: PointsDisplayProps) {
  const colorClass =
    points > 0
      ? 'points-display__value--positive'
      : points < 0
        ? 'points-display__value--negative'
        : 'points-display__value--zero';

  const displayValue = showSign && points > 0 ? `+${formatPoints(points)}` : `${formatPoints(points)}`;

  const classes = [
    'points-display',
    `points-display--${size}`,
    animated && 'points-display--animated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span className={`points-display__value ${colorClass}`}>
        {displayValue}
      </span>
      {label && <span className="points-display__label">{label}</span>}
    </div>
  );
}
