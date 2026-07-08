import { eq, and, sql, desc } from 'drizzle-orm';
import { activityLogs } from '../db/schema.js';
import {
  CATEGORIES,
  DAILY_POSITIVE_CAP,
  DAILY_POSITIVE_CAP_WITH_8HR_STUDY,
  getISTDate,
  subtractDay,
  getMonthStart,
} from '@get-better/shared';
import type { DailyCapStatus } from '@get-better/shared';
import type { Database } from '../db/index.js';

const CURRENT_RULES_VERSION = '1.0.0';

// ─── Points Calculation ──────────────────────────────────────────

export interface PointsResult {
  points: number;
  blocked: boolean;
  reason?: string;
}

/**
 * Calculate points for a new activity log.
 * Enforces category daily caps and global daily cap.
 */
export async function calculatePoints(
  userId: string,
  category: string,
  activity: string,
  logDate: string,
  db: Database
): Promise<PointsResult> {
  const categoryDef = CATEGORIES[category];
  if (!categoryDef) {
    return { points: 0, blocked: true, reason: `Unknown category: ${category}` };
  }

  // 1. Get today's logs for this user
  const todaysLogs = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.logDate, logDate)
      )
    );

  // 2. Check category daily cap
  if (categoryDef.maxDaily) {
    const categoryLogsToday = todaysLogs.filter(
      (l) => l.category === category && l.points > 0
    );
    if (categoryLogsToday.length >= categoryDef.maxDaily) {
      return { points: 0, blocked: true, reason: `Daily cap reached for ${categoryDef.label}` };
    }
  }

  // 3. Determine base points
  let points = 0;

  if (categoryDef.type === 'standard') {
    const activityDef = categoryDef.activities[activity];
    const penaltyDef = categoryDef.penalties?.[activity];

    if (activityDef) {
      points = activityDef.points;
    } else if (penaltyDef) {
      // Check if it's a compounding penalty
      if ('compounding' in penaltyDef) {
        const consecutiveDays = await getConsecutivePenaltyDays(userId, category, activity, logDate, db);
        points = penaltyDef.basePoints + (penaltyDef.compounding * consecutiveDays);
      } else {
        points = penaltyDef.points;
      }
    } else {
      return { points: 0, blocked: true, reason: `Unknown activity: ${activity}` };
    }
  } else if (categoryDef.type === 'masturbation') {
    // Count occurrences this month
    const monthStart = getMonthStart(logDate);
    const monthlyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, userId),
          eq(activityLogs.category, 'masturbation'),
          sql`${activityLogs.logDate} >= ${monthStart}`,
          sql`${activityLogs.logDate} <= ${logDate}`
        )
      );

    const occurrenceNumber = Number(monthlyCount[0]?.count ?? 0) + 1; // +1 for this new entry

    if (occurrenceNumber >= 5) {
      // More than 5 times → effect is 'reset_all_points' — we return a special flag
      points = 0; // The route handler will set total to 0
      return { points: -99999, blocked: false, reason: 'reset_all_points' };
    }

    const penaltyEntry = categoryDef.penalties.find(
      (p) => p.occurrence === occurrenceNumber
    );
    points = penaltyEntry?.points ?? -9;
  } else if (categoryDef.type === 'daily_log') {
    const penaltyDef = categoryDef.penalties[activity];
    if (penaltyDef) {
      if ('compounding' in penaltyDef) {
        const consecutiveDays = await getConsecutivePenaltyDays(userId, category, activity, logDate, db);
        points = penaltyDef.basePoints + (penaltyDef.compounding * consecutiveDays);
      } else {
        points = (penaltyDef as { points: number }).points;
      }
    }
  }

  // 4. Enforce global daily cap for POSITIVE points
  if (points > 0) {
    const hasStudied8hr = todaysLogs.some((l) => l.activity === 'study_8hr');
    const dailyCap = hasStudied8hr ? DAILY_POSITIVE_CAP_WITH_8HR_STUDY : DAILY_POSITIVE_CAP;

    const todaysPositiveTotal = todaysLogs
      .filter((l) => l.points > 0)
      .reduce((sum, l) => sum + l.points, 0);

    const headroom = dailyCap - todaysPositiveTotal;
    if (headroom <= 0) {
      return { points: 0, blocked: true, reason: 'Daily positive point cap reached' };
    }
    points = Math.min(points, headroom);
  }

  return { points, blocked: false };
}

// ─── Daily Cap Status ────────────────────────────────────────────

export async function getDailyCapStatus(
  userId: string,
  logDate: string,
  db: Database
): Promise<DailyCapStatus> {
  const todaysLogs = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.logDate, logDate)
      )
    );

  const hasStudied8hr = todaysLogs.some((l) => l.activity === 'study_8hr');
  const globalCap = hasStudied8hr ? DAILY_POSITIVE_CAP_WITH_8HR_STUDY : DAILY_POSITIVE_CAP;

  const globalPositiveUsed = todaysLogs
    .filter((l) => l.points > 0)
    .reduce((sum, l) => sum + l.points, 0);

  const categoryCaps: Record<string, { used: number; cap: number | null }> = {};
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const catLogs = todaysLogs.filter((l) => l.category === key && l.points > 0);
    categoryCaps[key] = {
      used: catLogs.length,
      cap: cat.maxDaily ?? null,
    };
  }

  return {
    globalPositiveUsed,
    globalPositiveCap: globalCap,
    categoryCaps,
    hasStudied8hr,
  };
}

// ─── Consecutive Penalty Days ────────────────────────────────────

async function getConsecutivePenaltyDays(
  userId: string,
  category: string,
  activity: string,
  logDate: string,
  db: Database
): Promise<number> {
  // Look backwards from the day before logDate to find consecutive days with this penalty
  let count = 0;
  let checkDate = subtractDay(logDate);

  // Check up to 30 days back to prevent infinite loop
  for (let i = 0; i < 30; i++) {
    const logs = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, userId),
          eq(activityLogs.category, category),
          eq(activityLogs.activity, activity),
          eq(activityLogs.logDate, checkDate)
        )
      );

    if (logs.length > 0) {
      count++;
      checkDate = subtractDay(checkDate);
    } else {
      break;
    }
  }

  return count;
}

export { CURRENT_RULES_VERSION };
