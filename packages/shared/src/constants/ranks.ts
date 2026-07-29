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

// ─── Daily Point Cap ─────────────────────────────────────────────

export const DAILY_POSITIVE_CAP = 6;
export const DAILY_POSITIVE_CAP_WITH_6HR_STUDY = 7;
export const DAILY_POSITIVE_CAP_WITH_8HR_STUDY = 8;

// ─── Fail to achieve at least one → -1 ──────────────────────────

export const FAIL_PENALTY = -1;

// ─── High-Score Streak Bonuses ───────────────────────────────────

export const HIGH_SCORE_STREAK_BONUSES = {
  // 6 consecutive days of ≥7pt daily (any mix of 7 and 8): +2 bonus
  THRESHOLD_7: { requiredDays: 6, minDailyPoints: 7, bonus: 2 },
  // 6 consecutive days of exactly 8pt daily: +4 bonus (replaces the +2)
  THRESHOLD_8: { requiredDays: 6, minDailyPoints: 8, bonus: 4 },
} as const;

// ─── Season System ───────────────────────────────────────────────

export const SEASON_CONFIG = {
  startDate: '2026-07-30',  // First season start
  durationDays: 84,
} as const;

export type SeasonInfo = {
  seasonNumber: number;
  seasonStart: string;
  seasonEnd: string;
  daysRemaining: number;
  daysElapsed: number;
};

/**
 * Add N days to a date string 'YYYY-MM-DD'.
 */
function addDays(dateStr: string, n: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().split('T')[0];
}

/**
 * Calculate the number of days between two date strings (inclusive of start, exclusive of end).
 */
function daysBetween(start: string, end: string): number {
  const startDate = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T00:00:00Z');
  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate current season info based on a reference date.
 */
export function getCurrentSeason(referenceDate?: string): SeasonInfo {
  const refDateStr = referenceDate ?? new Date().toISOString().split('T')[0];
  const diffDays = daysBetween(SEASON_CONFIG.startDate, refDateStr);

  if (diffDays < 0) {
    // Pre-season: season 0
    const seasonEnd = addDays(SEASON_CONFIG.startDate, SEASON_CONFIG.durationDays - 1);
    return {
      seasonNumber: 0,
      seasonStart: SEASON_CONFIG.startDate,
      seasonEnd,
      daysRemaining: Math.abs(diffDays) + SEASON_CONFIG.durationDays,
      daysElapsed: 0,
    };
  }

  const seasonIndex = Math.floor(diffDays / SEASON_CONFIG.durationDays);
  const seasonStart = addDays(SEASON_CONFIG.startDate, seasonIndex * SEASON_CONFIG.durationDays);
  const seasonEnd = addDays(seasonStart, SEASON_CONFIG.durationDays - 1);
  const elapsed = diffDays - (seasonIndex * SEASON_CONFIG.durationDays);

  return {
    seasonNumber: seasonIndex + 1,
    seasonStart,
    seasonEnd,
    daysRemaining: SEASON_CONFIG.durationDays - elapsed,
    daysElapsed: elapsed,
  };
}
