import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 'var(--space-xs)' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h1 className="text-headline">Reset Password</h1>
          <p className="text-body-sm text-subtle">
            Enter your email and choose a new password.
          </p>
        </div>

        <Card className="p-lg flex flex-col gap-md" style={{ marginTop: 'var(--space-md)' }}>
          {success ? (
            <div className="flex flex-col items-center gap-md text-center p-sm">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-body-sm" style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                Password updated! Redirecting to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xxs">
                <label htmlFor="reset-email" className="text-caption text-muted">
                  Email Address
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex flex-col gap-xxs">
                <label htmlFor="new-password" className="text-caption text-muted">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="flex flex-col gap-xxs">
                <label htmlFor="confirm-password" className="text-caption text-muted">
                  Confirm New Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                style={{ marginTop: 'var(--space-xs)' }}
              >
                Reset Password
              </Button>
            </form>
          )}
        </Card>

        <div className="text-center" style={{ marginTop: 'var(--space-lg)' }}>
          <p className="text-body-sm text-subtle">
            Remembered it?{' '}
            <Link to="/login" className="interactive text-primary" style={{ fontWeight: 500 }}>
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
