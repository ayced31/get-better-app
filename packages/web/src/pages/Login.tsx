import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useLogin } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check if user has signed up within 24 hrs
    const signupInfoRaw = localStorage.getItem('get_better_signup_info');
    if (signupInfoRaw) {
      try {
        const info = JSON.parse(signupInfoRaw);
        const isWithin24Hrs = Date.now() - info.timestamp < 24 * 60 * 60 * 1000;
        if (isWithin24Hrs && info.token && info.user) {
          // Log in without credentials!
          useAuthStore.getState().login(info.token, info.user);
          navigate(from, { replace: true });
          return;
        }
      } catch (err) {
        console.error('Failed to parse auto login details:', err);
      }
    }

    if (!identifier || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    try {
      await loginMutation.mutateAsync({ identifier, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div
      className="flex items-center justify-center p-md fade-in"
      style={{
        marginTop: 'calc(var(--nav-height) + var(--space-md))',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
        minHeight: 'calc(100vh - var(--nav-height) - var(--bottom-nav-height) - var(--space-xl) * 2)',
      }}
    >
      <div className="fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center p-sm flex flex-col items-center gap-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="2" style={{ marginBottom: 'var(--space-xs)' }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <h1 className="text-headline">Welcome back</h1>
          <p className="text-body-sm text-subtle">
            Log your daily grind, track points, and climb the board.
          </p>
        </div>

        <Card className="p-lg flex flex-col gap-md" style={{ marginTop: 'var(--space-md)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xxs">
              <label htmlFor="identifier" className="text-caption text-muted">
                Username or Email
              </label>
              <Input
                id="identifier"
                type="text"
                placeholder="you@domain.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="flex flex-col gap-xxs">
              <label htmlFor="password" className="text-caption text-muted">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {errorMsg && (
              <div
                className="text-body-sm text-danger p-xs"
                style={{
                  backgroundColor: 'rgba(229, 72, 77, 0.1)',
                  border: '1px solid rgba(229, 72, 77, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loginMutation.isPending}
              style={{ marginTop: 'var(--space-xs)' }}
            >
              Sign In
            </Button>
          </form>
        </Card>

        <div className="text-center" style={{ marginTop: 'var(--space-lg)' }}>
          <p className="text-body-sm text-subtle">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="interactive text-primary"
              style={{ fontWeight: 500 }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
