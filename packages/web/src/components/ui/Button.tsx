// ─── Button Component ───────────────────────────────────────────
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    fullWidth && 'btn--full',
    loading && 'btn--loading',
    !children && icon && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {icon && <span className="btn__icon-wrapper">{icon}</span>}
      {children}
    </button>
  );
}
