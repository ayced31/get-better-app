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

export type MasturbationPenalty = {
  occurrence: number | string;
  points?: number;
  effect?: 'reset_all_points';
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

export type MasturbationCategory = CategoryBase & {
  type: 'masturbation';
  tracking: 'monthly';
  penalties: MasturbationPenalty[];
};

export type DailyLogCategory = CategoryBase & {
  type: 'daily_log';
  penalties: Record<string, CompoundingPenaltyDefinition>;
  streakBonuses: { days: number; points: number }[];
  streakReset: 'monthly';
};

export type Category = StandardCategory | MasturbationCategory | DailyLogCategory;

export const CATEGORIES: Record<string, Category> = {
  physical: {
    type: 'standard',
    label: 'Physical Activity',
    maxDaily: 2,
    activities: {
      steps_10k: { label: '10k Steps', points: 1 },
      gym: { label: 'Gym', points: 1 },
      yoga: { label: 'Yoga / Home Workout', points: 1 },
    },
    penalties: {
      workout_gap: { label: '2+ day gap between workouts', points: -2 },
    },
  },
  diet: {
    type: 'standard',
    label: 'Diet',
    activities: {
      no_junk: { label: 'No Junk', points: 1 },
      diet_goals: { label: 'Diet Goals Completed', points: 1 },
    },
  },
  sleep: {
    type: 'standard',
    label: 'Sleep',
    activities: {},
    penalties: {
      doomscrolling: { label: 'Doomscrolling >2hr', points: -2 },
      late_sleep: { label: 'Sleeping after 12', basePoints: -2, compounding: -0.5 },
    },
  },
  study: {
    type: 'standard',
    label: 'Study',
    activities: {
      study_2hr: { label: 'Studying 2hr', points: 1 },
      study_4hr: { label: 'Studying 4hr', points: 2 },
      study_8hr: { label: 'Studying 8hr', points: 3, raiseDailyCap: true },
    },
    penalties: {
      no_study: { label: 'No Study', basePoints: -1, compounding: -1 },
    },
  },
  masturbation: {
    type: 'masturbation',
    label: 'Masturbation (Monthly)',
    tracking: 'monthly',
    penalties: [
      { occurrence: 1, points: -3 },
      { occurrence: 2, points: -5 },
      { occurrence: 3, points: -7 },
      { occurrence: 4, points: -9 },
      { occurrence: '5+', effect: 'reset_all_points' },
    ],
  },
  daily_log: {
    type: 'daily_log',
    label: 'Daily Log',
    penalties: {
      miss: { label: 'Daily log miss', basePoints: -1, compounding: -1 },
    },
    streakBonuses: [
      { days: 7, points: 1 },
      { days: 14, points: 2 },
      { days: 21, points: 3 },
      { days: 28, points: 4 },
    ],
    streakReset: 'monthly',
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
