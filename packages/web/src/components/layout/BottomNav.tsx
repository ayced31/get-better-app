// ─── Bottom Navigation (Mobile) ─────────────────────────────────
import { Link, useLocation } from 'react-router';
import { useAuthStore } from '../../stores/auth';
import './BottomNav.css';

const BOTTOM_NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    requiresAuth: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 17V9M12 17V12M15 17V7" />
      </svg>
    ),
  },
  {
    to: '/log',
    label: 'Log',
    requiresAuth: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    to: '/leaderboard',
    label: 'Board',
    requiresAuth: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a7 7 0 0 1 7 7c0 2.5-2 4.5-4.5 4.5h-5C7 13.5 5 11.5 5 9a7 7 0 0 1 7-7Z" />
      </svg>
    ),
  },
  {
    to: '/rules',
    label: 'Rules',
    requiresAuth: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    requiresAuth: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const isAuthenticated = token !== null && user !== null;

  const visibleItems = BOTTOM_NAV_ITEMS.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  if (!isAuthenticated) return null;

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <div className="bottom-nav__container">
        {visibleItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`bottom-nav__item ${
              location.pathname === item.to ? 'bottom-nav__item--active' : ''
            }`}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
