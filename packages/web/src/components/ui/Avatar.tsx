// ─── Avatar Component ───────────────────────────────────────────
import './Avatar.css';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const displayName = name || 'U';
  const initials = getInitials(displayName);

  const classes = [
    'avatar',
    `avatar--${size}`,
    !src && 'avatar--default-theme',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} aria-label={displayName}>
      {src ? (
        <img
          className="avatar__image"
          src={src}
          alt={displayName}
          loading="lazy"
        />
      ) : (
        initials
      )}
    </div>
  );
}
