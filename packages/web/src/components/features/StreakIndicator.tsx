// ─── Streak Indicator ───────────────────────────────────────────
import './StreakIndicator.css';

interface StreakIndicatorProps {
  streak: number;
  showLabel?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}

export function StreakIndicator({
  streak,
  showLabel = true,
  size = 'md',
  className = '',
}: StreakIndicatorProps) {
  const intensityClass =
    streak === 0 ? 'streak--zero' : streak >= 7 ? 'streak--hot' : '';

  const classes = [
    'streak',
    size !== 'md' && `streak--${size}`,
    intensityClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      <span className="streak__icon" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-warning)', marginRight: 'var(--space-xxs)' }}>STREAK</span>
      <span className="streak__count">{streak}</span>
      {showLabel && <span className="streak__label">day streak</span>}
    </span>
  );
}
