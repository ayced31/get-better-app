// ─── Rank System ─────────────────────────────────────────────────

export type Rank = {
  name: string;
  minPoints: number;
  maxPoints: number;
  emoji: string;
};

export const RANKS: Rank[] = [
  { name: 'Muthmantri', minPoints: -Infinity, maxPoints: -10, emoji: '' },
  { name: 'Come on son', minPoints: -10, maxPoints: 0, emoji: '' },
  { name: 'Infant', minPoints: 0, maxPoints: 20, emoji: '' },
  { name: 'Child', minPoints: 20, maxPoints: 40, emoji: '' },
  { name: 'Boy', minPoints: 40, maxPoints: 60, emoji: '' },
  { name: 'Teen', minPoints: 60, maxPoints: 80, emoji: '' },
  { name: 'Man Child', minPoints: 80, maxPoints: 100, emoji: '' },
  { name: 'Man', minPoints: 100, maxPoints: 120, emoji: '' },
  { name: 'Beta Male', minPoints: 120, maxPoints: 140, emoji: '' },
  { name: 'Alpha Male', minPoints: 140, maxPoints: 200, emoji: '' },
  { name: 'Sigma Male', minPoints: 200, maxPoints: 240, emoji: '' },
  { name: 'Invincible', minPoints: 240, maxPoints: 280, emoji: '' },
  { name: 'Giga Chad', minPoints: 280, maxPoints: 400, emoji: '' },
  { name: 'Moonlord', minPoints: 400, maxPoints: Infinity, emoji: '' },
];

/**
 * Get the rank for a given point total.
 * Uses raw score (can be negative) for rank lookup.
 */
export function getRank(points: number): Rank {
  return RANKS.find((r) => points >= r.minPoints && points < r.maxPoints) ?? RANKS[RANKS.length - 1];
}

/**
 * Get progress to next rank as a percentage (0-100).
 */
export function getRankProgress(points: number): { current: Rank; next: Rank | null; progress: number } {
  const current = getRank(points);
  const currentIndex = RANKS.indexOf(current);
  const next = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

  if (!next) return { current, next: null, progress: 100 };

  const rangeSize = next.minPoints - current.minPoints;
  const progress = Math.min(100, Math.max(0, ((points - current.minPoints) / rangeSize) * 100));
  return { current, next, progress };
}

// ─── Max-Points Streak Perks ─────────────────────────────────────

export const MAX_POINTS_STREAK_PERKS = [
  { days: 6, bonus: 2 },
  { days: 12, bonus: 4 },
  { days: 18, bonus: 6 },
  { days: 24, bonus: 8 },
  { days: 30, bonus: 10 },
] as const;

// ─── Daily Point Cap ─────────────────────────────────────────────

export const DAILY_POSITIVE_CAP = 5;
export const DAILY_POSITIVE_CAP_WITH_8HR_STUDY = 6;

// ─── Fail to achieve at least one → -1 ──────────────────────────

export const FAIL_PENALTY = -1;
