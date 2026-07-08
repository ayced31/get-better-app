import { Routes, Route, Navigate } from 'react-router';
import { useCurrentUser } from './hooks/useAuth';
import { PageShell } from './components/layout/PageShell';
import { AuthLayout } from './components/layout/AuthLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { Rules } from './pages/Rules';
import { Dashboard } from './pages/Dashboard';
import { LogActivity } from './pages/LogActivity';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { History } from './pages/History';
import { useAuthStore } from './stores/auth';

import { AlertDialog } from './components/ui/AlertDialog';

function NotFoundRedirect() {
  const token = useAuthStore((state) => state.token);
  return <Navigate to={token ? "/dashboard" : "/"} replace />;
}

export default function App() {
  // Try fetching current user on app mount if JWT is present in local storage
  useCurrentUser();

  return (
    <>
      <AlertDialog />
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route element={<PageShell />}>
          {/* Public inside shell */}
          <Route path="/rules" element={<Rules />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected inside shell */}
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<LogActivity />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile/:id?" element={<Profile />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Route>

        {/* Wildcard redirect */}
        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </>
  );
}
// Note: BrowserRouter wraps App in main.tsx

