// ─── Shared Types ────────────────────────────────────────────────

export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type ActivityLog = {
  id: string;
  userId: string;
  logDate: string; // 'YYYY-MM-DD' in IST
  category: string;
  activity: string;
  points: number;
  rulesVersion: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type LeaderboardEntry = {
  user: User;
  totalPoints: number;
  displayPoints: number; // MAX(0, totalPoints)
  rank: string;
  rankEmoji: string;
  todayPoints: number;
  streak: number;
};

export type UserStats = {
  user: User;
  totalPoints: number;
  displayPoints: number;
  rank: string;
  rankEmoji: string;
  rankProgress: number;
  nextRank: string | null;
  streak: number;
  todayPoints: number;
  todayLogs: ActivityLog[];
  monthlyBreakdown: { date: string; points: number }[];
  monthlyStats: {
    workoutCount: number;
    studyHours: number;
    slipsCount: number;
    missesCount: number;
    lateSleepCount: number;
  };
};

export type DailyCapStatus = {
  globalPositiveUsed: number;
  globalPositiveCap: number;
  categoryCaps: Record<string, { used: number; cap: number | null }>;
  hasStudied8hr: boolean;
};

// ─── API Response Types ──────────────────────────────────────────

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details?: unknown;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LogResponse = {
  log: ActivityLog;
  capStatus: DailyCapStatus;
};
