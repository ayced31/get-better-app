// ─── Activity Categories & Rules ─────────────────────────────────

export type ActivityDefinition = {
  label: string;
  points: number;
  raiseDailyCap?: boolean;
};

export type PenaltyDefinition = {
  label: string;
  points: number;
};

export type CompoundingPenaltyDefinition = {
  label: string;
  basePoints: number;
  compounding: number;
};

export type CategoryBase = {
  label: string;
  maxDaily?: number;
};

export type StandardCategory = CategoryBase & {
  type: 'standard';
  activities: Record<string, ActivityDefinition>;
  penalties?: Record<string, PenaltyDefinition | CompoundingPenaltyDefinition>;
};

export type RetentionMilestone = {
  days: number;
  points: number;
};

export type RetentionCategory = CategoryBase & {
  type: 'retention';
  milestones: RetentionMilestone[];
};

export type Category = StandardCategory | RetentionCategory;

export const CATEGORIES: Record<string, Category> = {
  physical: {
    type: 'standard',
    label: 'Physical Activity',
    maxDaily: 2,
    activities: {
      steps_10k: { label: '10k Steps', points: 1 },
      gym: { label: 'Gym', points: 1 },
      running_3km: { label: 'Running 3km+ (Outdoor)', points: 1.5 },
      calisthenics: { label: 'Calisthenics', points: 0.5 },
    },
    penalties: {
      workout_gap: { label: '2+ day gap between workouts', points: -2 },
    },
  },
  diet: {
    type: 'standard',
    label: 'Diet',
    activities: {
      protein_fiber: { label: 'Protein ≥ 100g & 30g Fiber', points: 2 },
    },
    penalties: {
      junk: { label: 'Junk (Oily/Ultra-Processed >200kcal)', points: -1 },
    },
  },
  sleep: {
    type: 'standard',
    label: 'Sleep',
    activities: {
      good_wake: { label: 'Waking up before 8am w/ 6-8hr sleep', points: 1 },
    },
    penalties: {
      sleep_after_3am: { label: 'Sleep after 3am', points: -2 },
    },
  },
  lifestyle: {
    type: 'standard',
    label: 'Lifestyle',
    activities: {},
    penalties: {
      youtube_2hr: { label: 'YouTube Video ≥ 2hrs', points: -2 },
      doomscrolling: { label: 'Doomscrolling ≥ 1hr', points: -2 },
    },
  },
  study: {
    type: 'standard',
    label: 'Study',
    activities: {
      study_2hr: { label: 'Studying 2hr', points: 1 },
      study_4hr: { label: 'Studying 4hr', points: 2 },
      study_6hr: { label: 'Studying 6hr', points: 3, raiseDailyCap: true },
      study_8hr: { label: 'Studying 8hr', points: 4, raiseDailyCap: true },
    },
    penalties: {
      no_study: { label: 'No Study', basePoints: -1, compounding: -1 },
    },
  },
  retention: {
    type: 'retention',
    label: 'Retention',
    milestones: [
      { days: 7, points: 2 },
      { days: 14, points: 4 },
      { days: 21, points: 6 },
      { days: 28, points: 8 },
      { days: 35, points: 10 },
      { days: 42, points: 12 },
      { days: 49, points: 14 },
    ],
  },
} as const;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>;

// All valid activity slugs across all categories
export const ALL_ACTIVITIES = Object.entries(CATEGORIES).flatMap(([categoryKey, cat]) => {
  const activities = 'activities' in cat && cat.activities
    ? Object.keys(cat.activities).map((key) => ({ category: categoryKey, activity: key }))
    : [];
  const penalties = 'penalties' in cat && cat.penalties && !Array.isArray(cat.penalties)
    ? Object.keys(cat.penalties as Record<string, unknown>).map((key) => ({ category: categoryKey, activity: key }))
    : [];
  return [...activities, ...penalties];
});

/**
 * Get retention milestone points for a given number of days.
 * Pattern: every 7 days = days/7 * 2 points.
 */
export function getRetentionMilestonePoints(days: number): number {
  return Math.floor(days / 7) * 2;
}
