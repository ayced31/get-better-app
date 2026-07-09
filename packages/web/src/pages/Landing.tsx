import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/auth';

export function Landing() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-canvas)',
        color: 'var(--color-ink)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ─── Header ─── */}
      <header
        style={{
          height: 'var(--nav-height)',
          borderBottom: '1px solid var(--color-hairline)',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--color-canvas)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Get Better
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <section
          style={{
            padding: 'var(--space-section) 0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div className="container flex flex-col items-center gap-md">
            <span
              className="text-eyebrow text-primary"
              style={{
                letterSpacing: '1.5px',
                border: '1px solid rgba(94, 106, 210, 0.2)',
                backgroundColor: 'rgba(94, 106, 210, 0.05)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
              }}
            >
              Built for Close Friends
            </span>

            <h1
              className="text-display-xl"
              style={{
                maxWidth: '800px',
                fontWeight: 600,
                marginTop: 'var(--space-xs)',
              }}
            >
              Self-improvement tracker, gamified.
            </h1>

            <p
              className="text-subhead text-muted"
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Log your daily activities, accumulate points, and compete on a friendly leaderboard. Hold your circle accountable.
            </p>

            <div className="flex gap-md" style={{ marginTop: 'var(--space-lg)' }}>
              <Button variant="primary" size="lg" onClick={() => navigate('/register')}>
                Get Started
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/rules')}>
                Explore Rules
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Product Screenshot / Mockup ─── */}
        <section style={{ paddingBottom: 'var(--space-section)' }}>
          <div className="container">
            <Card
              className="p-lg"
              style={{
                maxWidth: '900px',
                margin: '0 auto',
                backgroundColor: 'var(--color-surface-1)',
                border: '1px solid var(--color-hairline-strong)',
                borderRadius: 'var(--radius-xl)',
                position: 'relative',
              }}
            >
              {/* Leaderboard Mockup inside Surface Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-sm)' }}>
                  <span className="text-card-title">Friend Leaderboard</span>
                  <span className="text-caption text-primary" style={{ fontWeight: 600 }}>Active Period: All Time</span>
                </div>

                <div className="flex flex-col gap-xs">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-sm)',
                      backgroundColor: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-hairline)',
                    }}
                  >
                    <div className="flex items-center gap-sm">
                      <span className="text-muted" style={{ fontWeight: 600, width: '20px' }}>1</span>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-focus)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 600 }}>A</div>
                      <a href="https://github.com/ayced31" target="_blank" rel="noopener noreferrer" className="text-body-sm" style={{ fontWeight: 500, color: 'inherit', textDecoration: 'none' }}>Ayce</a>
                      <span className="text-caption" style={{ border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '10px' }}>Sigma Male</span>
                    </div>
                    <div className="flex items-center gap-md">
                      <span className="text-caption text-warning" style={{ fontWeight: 600 }}>STREAK 12</span>
                      <span className="text-body-sm" style={{ fontWeight: 600 }}>452</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-sm)',
                      backgroundColor: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-hairline)',
                    }}
                  >
                    <div className="flex items-center gap-sm">
                      <span className="text-muted" style={{ fontWeight: 600, width: '20px' }}>2</span>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 600 }}>C</div>
                      <span className="text-body-sm" style={{ fontWeight: 500 }}>Chad</span>
                      <span className="text-caption" style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '10px' }}>Alpha Male</span>
                    </div>
                    <div className="flex items-center gap-md">
                      <span className="text-caption text-warning" style={{ fontWeight: 600 }}>STREAK 7</span>
                      <span className="text-body-sm" style={{ fontWeight: 600 }}>310</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-sm)',
                      backgroundColor: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-hairline)',
                    }}
                  >
                    <div className="flex items-center gap-sm">
                      <span className="text-muted" style={{ fontWeight: 600, width: '20px' }}>3</span>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-surface-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', fontWeight: 600 }}>J</div>
                      <span className="text-body-sm" style={{ fontWeight: 500 }}>John Doe</span>
                      <span className="text-caption" style={{ border: '1px solid var(--color-ink-subtle)', color: 'var(--color-ink-subtle)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '10px' }}>Boy</span>
                    </div>
                    <div className="flex items-center gap-md">
                      <span className="text-caption text-muted" style={{ fontWeight: 600 }}>STREAK 0</span>
                      <span className="text-body-sm" style={{ fontWeight: 600 }}>58</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ─── Features Grid ─── */}
        <section
          style={{
            backgroundColor: 'var(--color-surface-1)',
            borderTop: '1px solid var(--color-hairline)',
            padding: 'var(--space-section) 0',
          }}
        >
          <div className="container">
            <div
              className="grid gap-lg"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              }}
            >
              <div className="flex flex-col gap-xs">
                <div style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: 600 }}>01</div>
                <h3 className="text-card-title">Points System</h3>
                <p className="text-body-sm text-subtle">
                  Earn points for steps, workouts, no-junk diet, and study goals. Deduct points for late sleep, doomscrolling, or logging misses.
                </p>
              </div>

              <div className="flex flex-col gap-xs">
                <div style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: 600 }}>02</div>
                <h3 className="text-card-title">Daily Caps</h3>
                <p className="text-body-sm text-subtle">
                  Enforces strict caps per day to prevent artificial boosting. Positive daily cap is 5 points, expandable to 6 by completing an 8-hour study goal.
                </p>
              </div>

              <div className="flex flex-col gap-xs">
                <div style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: 600 }}>03</div>
                <h3 className="text-card-title">Dynamic Streaks</h3>
                <p className="text-body-sm text-subtle">
                  Accountability streaks are automatically calculated based on consecutive logging. Keep logging daily to build multipliers and avoid missed-day compounding penalties.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer
        style={{
          borderTop: '1px solid var(--color-hairline)',
          padding: 'var(--space-lg) 0',
          textAlign: 'center',
          backgroundColor: 'var(--color-canvas)',
        }}
      >
        <div className="container flex flex-col gap-xs text-caption text-tertiary">
          <p>Made with ❤️ by <a href="https://github.com/ayced31" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>ayce</a></p>
          <p>Get Better is an invite-only gamified tracker. All times registered in IST.</p>
        </div>
      </footer>
    </div>
  );
}
