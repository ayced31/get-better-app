// ─── Register Page ────────────────────────────────────────────────
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useRegister } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const registerMutation = useRegister();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        username,
        email,
        password,
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div
      className="flex items-center justify-center fade-in"
      style={{
        minHeight: 'calc(100vh - var(--nav-height) - 80px)',
        boxSizing: 'border-box',
        paddingBottom: '8%',
      }}
    >
      <div className="fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center p-sm flex flex-col items-center gap-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="2" style={{ marginBottom: 'var(--space-xs)' }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <h1 className="text-headline">Join Get Better</h1>
          <p className="text-body-sm text-subtle">
            Get points, build habits, and hold each other accountable.
          </p>
        </div>

        <Card className="p-lg flex flex-col gap-md" style={{ marginTop: 'var(--space-md)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xxs">
              <label htmlFor="username" className="text-caption text-muted">
                Username *
              </label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. giga_chad"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="flex flex-col gap-xxs">
              <label htmlFor="email" className="text-caption text-muted">
                Email Address *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. chad@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="flex flex-col gap-xxs">
              <label htmlFor="password" className="text-caption text-muted">
                Password (min 6 characters) *
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
              loading={registerMutation.isPending}
              style={{ marginTop: 'var(--space-xs)' }}
            >
              Sign Up
            </Button>
          </form>
        </Card>

        <div className="text-center" style={{ marginTop: 'var(--space-lg)' }}>
          <p className="text-body-sm text-subtle">
            Already have an account?{' '}
            <Link
              to="/login"
              className="interactive text-primary"
              style={{ fontWeight: 500 }}
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
