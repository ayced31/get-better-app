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
          <li><strong>Max points in one day:</strong> 6 points default.</li>
          <li><strong>Study bonus cap:</strong> Studying for 6 hours boosts the daily cap to 7 points. Studying for 8 hours boosts it to 8 points.</li>
          <li><strong>Floor limit:</strong> Your overall score can go below 0 (into negative points). Falling into negative territory will degrade your rank.</li>
          <li><strong>Missed Log Penalty:</strong> Missing a daily log results in an automated -1 point penalty, which compounds consecutively.</li>
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
            <div className="flex justify-between"><span>Running 3km+</span><span className="text-success">+1.5</span></div>
            <div className="flex justify-between"><span>Calisthenics</span><span className="text-success">+0.5</span></div>
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
            <div className="flex justify-between"><span>Protein ≥ 100g & 30g Fiber</span><span className="text-success">+2</span></div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>Junk Food</span><span className="text-danger">-1</span>
            </div>
          </div>
        </Card>

        {/* Category: Sleep */}
        <Card className="p-md flex flex-col gap-xs">
          <h3 className="text-card-title">Sleep</h3>
          <p className="text-caption text-tertiary">Rewards and Penalties</p>
          <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            <div className="flex justify-between"><span>Waking up before 8am w/ 6-8hr sleep</span><span className="text-success">+1</span></div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>Sleeping after 3am</span><span className="text-danger">-2</span>
            </div>
          </div>
        </Card>
        
        {/* Category: Lifestyle */}
        <Card className="p-md flex flex-col gap-xs">
          <h3 className="text-card-title">Lifestyle</h3>
          <p className="text-caption text-tertiary">Mindful living</p>
          <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            <div className="flex justify-between">
              <span>Read Book (10 Pages)</span><span className="text-success">+0.5</span>
            </div>
            <div className="flex justify-between">
              <span>Educational Podcast (30 min)</span><span className="text-success">+0.5</span>
            </div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>YouTube ≥ 2hrs</span><span className="text-danger">-2</span>
            </div>
            <div className="flex justify-between">
              <span>Doomscrolling ≥ 1hr</span><span className="text-danger">-2</span>
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
            <div className="flex justify-between"><span>Studying 6hr</span><span className="text-success">+3 (cap→7)</span></div>
            <div className="flex justify-between"><span>Studying 8hr</span><span className="text-success">+4 (cap→8)</span></div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>No Study</span>
              <span className="text-danger">-1</span>
            </div>
            <div className="text-caption text-tertiary" style={{ marginTop: '2px' }}>
              * No Study penalty compounds by -1 points consecutively if trend continues.
            </div>
          </div>
        </Card>

        {/* Category: Retention */}
        <Card className="p-md flex flex-col gap-xs">
          <h3 className="text-card-title">Retention</h3>
          <p className="text-caption text-tertiary">Milestone system</p>
          <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
            <div className="flex justify-between"><span>Every 7 days streak</span><span className="text-success">Increasing points</span></div>
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--color-hairline)', paddingTop: '4px', marginTop: '4px' }}>
              <span>Slip</span>
              <span className="text-muted">Resets streak, no penalty</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Perks & Streaks */}
      <Card className="p-md flex flex-col gap-xs">
        <h3 className="text-card-title">Perks & Streak Bonuses</h3>
        <div className="grid gap-sm text-body-sm text-subtle" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 'var(--space-xxs)' }}>
          <div className="flex flex-col gap-xxs">
            <strong className="text-ink">High Score Streaks</strong>
            <div className="flex justify-between" style={{ marginTop: 'var(--space-xxs)' }}><span>≥ 7pt for 6 days</span><span className="text-success">+2</span></div>
            <div className="flex justify-between"><span>8pt for 6 days</span><span className="text-success">+4</span></div>
          </div>
        </div>
      </Card>
      
      {/* Season System */}
      <Card className="p-md flex flex-col gap-xs">
        <h3 className="text-card-title">Seasons</h3>
        <div className="flex flex-col gap-xxs text-body-sm text-subtle" style={{ marginTop: 'var(--space-xxs)' }}>
          <div><strong>Length:</strong> 84 days per season.</div>
          <div><strong>Reset:</strong> Points reset each season.</div>
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
