// ─── Badge Component ────────────────────────────────────────────
import { type ReactNode } from 'react';
import './Badge.css';

type BadgeVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'points' | 'streak';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const classes = [
    'badge',
    `badge--${variant}`,
    size !== 'md' && `badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
