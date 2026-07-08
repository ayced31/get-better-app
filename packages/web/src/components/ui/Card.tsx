// ─── Card Component ─────────────────────────────────────────────
import { type HTMLAttributes, type ReactNode } from 'react';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'surface-1' | 'surface-2' | 'surface-3';
  interactive?: boolean;
  flush?: boolean;
  compact?: boolean;
  children: ReactNode;
}

export function Card({
  variant = 'surface-1',
  interactive = false,
  flush = false,
  compact = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const classes = [
    'card',
    variant !== 'surface-1' && `card--${variant}`,
    interactive && 'card--interactive',
    flush && 'card--flush',
    compact && 'card--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card__header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`card__title ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card__body ${className}`} {...props}>
      {children}
    </div>
  );
}
