// ─── Rules Page ───────────────────────────────────────────────────
import { Card } from '../components/ui/Card';
import { RANKS } from '@get-better/shared';

export function Rules() {
  return (
    <div
      className="container p-md flex flex-col gap-lg fade-in"
      style={{
        marginTop: 'var(--space-md)',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-xl))',
        maxWidth: '800px',
      }}
    >
      <div className="flex flex-col gap-xxs">
        <span className="text-eyebrow text-primary" style={{ fontSize: '10px' }}>Documentation</span>
        <h1 className="text-display-lg" style={{ fontWeight: 600 }}>Rules & Points System</h1>
        <p className="text-body-sm text-subtle">
          Every detail of how points are won or lost. Log daily before midnight IST. Keep it honest.
        </p>
      </div>

      {/* Core Limits */}
      <Card className="p-md flex flex-col gap-xs" style={{ borderLeft: '3px solid var(--color-primary)' }}>
        <h2 className="text-body" style={{ fontWeight: 600 }}>Global Constraints</h2>
        <ul className="text-body-sm text-subtle flex flex-col gap-xxs" style={{ listStyleType: 'disc', paddingLeft: 'var(--space-md)' }}>
          <li><strong>Max points in one day:</strong> 5 points default.</li>
          <li><strong>Study bonus cap:</strong> Studying for 8 hours boosts the daily cap to 6 points.</li>
          <li><strong>Floor limit:</strong> Your overall score can go below 0 (into negative points). Falling into negative territory will degrade your rank to ranks like "Come on son" or "Muthmantri".</li>
          <li><strong>Daily log requirement:</strong> Failing to log at least one activity/penalty in a day results in a -1 base penalty. This penalty compounds by -1 for each consecutive missed day (e.g. -1, -2, -3, ...). If no logs are submitted by 4:00 AM IST of the next calendar day, the miss penalty is automatically registered.</li>
        </ul>
      </Card>

      {/* Rules Grid */}
      <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Category: Physical */}
        <Card className="p-md flex flex-col gap-xs">
          <h3 className="text-card-title">Physical Activity</h3>
          <p className="text-caption text-tertiary">Max 2 points daily</p>
          <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            <div className="flex justify-between"><span>10k Steps</span><span className="text-success">+1</span></div>
            <div className="flex justify-between"><span>Gym Session</span><span className="text-success">+1</span></div>
            <div className="flex justify-between"><span>Yoga / Home Workout</span><span className="text-success">+1</span></div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>2+ days gap between workouts</span>
              <span className="text-danger">-2</span>
            </div>
          </div>
        </Card>

        {/* Category: Diet */}
        <Card className="p-md flex flex-col gap-xs">
          <h3 className="text-card-title">Diet</h3>
          <p className="text-caption text-tertiary">No daily cap</p>
          <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            <div className="flex justify-between"><span>No Junk Food</span><span className="text-success">+1</span></div>
            <div className="flex justify-between"><span>Diet Goals Completed</span><span className="text-success">+1</span></div>
          </div>
        </Card>

        {/* Category: Sleep */}
        <Card className="p-md flex flex-col gap-xs">
          <h3 className="text-card-title">Sleep</h3>
          <p className="text-caption text-tertiary">Rewards and Penalties</p>
          <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            <div className="flex justify-between"><span>Sleeping before 11pm</span><span className="text-success">+1</span></div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>Doomscrolling &gt;2hr</span>
              <span className="text-danger">-2</span>
            </div>
            <div className="flex justify-between"><span>Sleeping after 12 Midnight</span><span className="text-danger">-2</span></div>
            <div className="text-caption text-tertiary" style={{ marginTop: '2px' }}>
              * Late sleep penalty compounds by -0.5 points consecutively if trend continues.
            </div>
          </div>
        </Card>

        {/* Category: Study */}
        <Card className="p-md flex flex-col gap-xs">
          <h3 className="text-card-title">Study</h3>
          <p className="text-caption text-tertiary">Progressive rewards</p>
          <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            <div className="flex justify-between"><span>Studying 2hr</span><span className="text-success">+1</span></div>
            <div className="flex justify-between"><span>Studying 4hr</span><span className="text-success">+2</span></div>
            <div className="flex justify-between"><span>Studying 8hr</span><span className="text-success">+3</span></div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>No Study</span>
              <span className="text-danger">-1</span>
            </div>
            <div className="text-caption text-tertiary" style={{ marginTop: '2px' }}>
              * No Study penalty compounds by -1 points consecutively if trend continues.
            </div>
          </div>
        </Card>
      </div>

      {/* Category: Masturbation */}
      <Card className="p-md flex flex-col gap-xs">
        <h3 className="text-card-title">Masturbation (Monthly)</h3>
        <p className="text-caption text-tertiary">Escalating penalties, resets monthly</p>
        <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
          <div className="flex justify-between"><span>First time in month</span><span className="text-danger">-3</span></div>
          <div className="flex justify-between"><span>Second time in month</span><span className="text-danger">-5</span></div>
          <div className="flex justify-between"><span>Third time in month</span><span className="text-danger">-7</span></div>
          <div className="flex justify-between"><span>Fourth time in month</span><span className="text-danger">-9</span></div>
          <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px', color: 'var(--color-danger)' }}>
            <span>Fifth time (or more) in month</span>
            <strong>ALL POINTS RESET TO 0</strong>
          </div>
        </div>
      </Card>

      {/* Perks & Streaks */}
      <Card className="p-md flex flex-col gap-xs">
        <h3 className="text-card-title">Perks & Streak Bonuses</h3>
        <div className="grid gap-sm text-body-sm text-subtle" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 'var(--space-xxs)' }}>
          <div className="flex flex-col gap-xxs">
            <strong className="text-ink">Daily Log Streak (Resets Monthly)</strong>
            <div className="flex justify-between" style={{ marginTop: 'var(--space-xxs)' }}><span>7 Days</span><span className="text-success">+1</span></div>
            <div className="flex justify-between"><span>14 Days</span><span className="text-success">+2</span></div>
            <div className="flex justify-between"><span>21 Days</span><span className="text-success">+3</span></div>
            <div className="flex justify-between"><span>28 Days</span><span className="text-success">+4</span></div>
          </div>
          <div className="flex flex-col gap-xxs">
            <strong className="text-ink">Achieving Max Points Daily Streak</strong>
            <div className="flex justify-between" style={{ marginTop: 'var(--space-xxs)' }}><span>6 Days</span><span className="text-success">+2</span></div>
            <div className="flex justify-between"><span>12 Days</span><span className="text-success">+4</span></div>
            <div className="flex justify-between"><span>18 Days</span><span className="text-success">+6</span></div>
            <div className="flex justify-between"><span>24 Days</span><span className="text-success">+8</span></div>
            <div className="flex justify-between"><span>30 Days</span><span className="text-success">+10</span></div>
          </div>
        </div>
      </Card>

      {/* Ranks list */}
      <Card className="p-md flex flex-col gap-sm">
        <h3 className="text-card-title">Rank Progression</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 'var(--space-xs)',
            marginTop: 'var(--space-xxs)',
          }}
        >
          {RANKS.filter((r) => r.minPoints !== -Infinity && r.maxPoints !== Infinity).map((r) => (
            <div
              key={r.name}
              style={{
                padding: 'var(--space-xs)',
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-hairline)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span className="text-body-sm" style={{ fontWeight: 600 }}>{r.name}</span>
              <span className="text-caption text-tertiary">{r.minPoints} to {r.maxPoints - 1} pts</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
