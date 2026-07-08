// ─── Top Navigation ─────────────────────────────────────────────
import { Link, useLocation, useNavigate } from 'react-router';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../stores/auth';
import './Nav.css';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', requiresAuth: true },
  { to: '/log', label: 'Log', requiresAuth: true },
  { to: '/leaderboard', label: 'Leaderboard', requiresAuth: true },
  { to: '/history', label: 'History', requiresAuth: true },
  { to: '/rules', label: 'Rules', requiresAuth: false },
];

export function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isAuthenticated = token !== null && user !== null;

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.requiresAuth || isAuthenticated
  );

  return (
    <nav className="nav">
      <div className="nav__container">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="nav__brand">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="2" style={{ marginRight: 'var(--space-xs)' }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Get Better
        </Link>

        <div className="nav__links">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav__link ${
                location.pathname === link.to ? 'nav__link--active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav__right">
          {isAuthenticated ? (
            <>
              <div
                className="nav__user"
                onClick={() => navigate('/profile')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
              >
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.displayName || user?.username}
                  size="sm"
                />
                <span className="nav__user-name">
                  {user?.displayName || user?.username}
                </span>
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={logout}
                title="Sign out"
                style={{ marginLeft: 'var(--space-xs)' }}
              >
                ↗
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              <Link to="/login" className="btn btn--secondary btn--sm" style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm" style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
