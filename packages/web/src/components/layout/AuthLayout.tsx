// ─── Auth Layout ────────────────────────────────────────────────
// Protected route wrapper — redirects to /login if not authenticated

import { Navigate, Outlet, useLocation } from 'react-router';
import { useIsAuthenticated } from '../../stores/auth';

export function AuthLayout() {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
