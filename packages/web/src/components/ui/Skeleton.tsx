// ─── Skeleton Component ─────────────────────────────────────────
import './Skeleton.css';

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'row' | 'badge' | 'button';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const classes = ['skeleton', `skeleton--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{
        ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
        ...(height ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
      }}
      aria-hidden="true"
    />
  );
}

// Convenience: Multiple skeleton lines
export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === count - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}
