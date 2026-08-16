import { eq, and, sql, desc } from 'drizzle-orm';
import { activityLogs } from '../db/schema.js';
import {
  CATEGORIES,
  DAILY_POSITIVE_CAP,
  DAILY_POSITIVE_CAP_WITH_6HR_STUDY,
  DAILY_POSITIVE_CAP_WITH_8HR_STUDY,
  getISTDate,
  subtractDay,
  getMonthStart,
} from '@get-better/shared';
import type { DailyCapStatus } from '@get-better/shared';
import type { Database } from '../db/index.js';

const CURRENT_RULES_VERSION = 'v2';

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
  const categoryDef = CATEGORIES[category as keyof typeof CATEGORIES];
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
    const categoryPositiveTotal = todaysLogs
      .filter((l) => l.category === category && l.points > 0)
      .reduce((sum, l) => sum + l.points, 0);
    if (categoryPositiveTotal >= categoryDef.maxDaily) {
      return { points: 0, blocked: false, reason: `Daily cap reached for ${categoryDef.label}. Points won't count.` };
    }
  }

  // 3. Determine base points
  let points = 0;

  if (categoryDef.type === 'standard' || categoryDef.type === 'retention') {
    const activityDef = (categoryDef as any).activities?.[activity];
    const penaltyDef = (categoryDef as any).penalties?.[activity];

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
  }

  // 4. Enforce category cap and global daily cap for POSITIVE points
  if (points > 0) {
    if (categoryDef.maxDaily) {
      const categoryPositiveTotal = todaysLogs
        .filter((l) => l.category === category && l.points > 0)
        .reduce((sum, l) => sum + l.points, 0);
      const categoryHeadroom = categoryDef.maxDaily - categoryPositiveTotal;
      if (categoryHeadroom <= 0) {
        return { points: 0, blocked: false, reason: `Daily cap reached for ${categoryDef.label}. Points won't count.` };
      }
      if (points > categoryHeadroom) {
        points = categoryHeadroom;
      }
    }

    const hasStudied8hr = activity === 'study_8hr' || todaysLogs.some((l) => l.activity === 'study_8hr');
    const hasStudied6hr = activity === 'study_6hr' || todaysLogs.some((l) => l.activity === 'study_6hr');
    
    let dailyCap = DAILY_POSITIVE_CAP;
    if (hasStudied8hr) {
      dailyCap = DAILY_POSITIVE_CAP_WITH_8HR_STUDY;
    } else if (hasStudied6hr) {
      dailyCap = DAILY_POSITIVE_CAP_WITH_6HR_STUDY;
    }

    const todaysPositiveTotal = todaysLogs
      .filter((l) => l.points > 0 && l.category !== 'retention')
      .reduce((sum, l) => sum + l.points, 0);

    const headroom = dailyCap - todaysPositiveTotal;
    if (headroom <= 0) {
      return { points: 0, blocked: false, reason: "Daily positive point cap reached. Points won't count." };
    }
    if (points > headroom) {
      return { points: headroom, blocked: false, reason: `Daily positive point cap reached. Only +${headroom} points will count.` };
    }
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
  const hasStudied6hr = todaysLogs.some((l) => l.activity === 'study_6hr');
  
  let globalCap = DAILY_POSITIVE_CAP;
  if (hasStudied8hr) {
    globalCap = DAILY_POSITIVE_CAP_WITH_8HR_STUDY;
  } else if (hasStudied6hr) {
    globalCap = DAILY_POSITIVE_CAP_WITH_6HR_STUDY;
  }

  const globalPositiveUsed = todaysLogs
    .filter((l) => l.points > 0 && l.category !== 'retention')
    .reduce((sum, l) => sum + l.points, 0);

  const categoryCaps: Record<string, { used: number; cap: number | null }> = {};
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const catPositiveUsed = todaysLogs
      .filter((l) => l.category === key && l.points > 0)
      .reduce((sum, l) => sum + l.points, 0);
    categoryCaps[key] = {
      used: catPositiveUsed,
      cap: cat.maxDaily ?? null,
    };
  }

  return {
    globalPositiveUsed,
    globalPositiveCap: globalCap,
    categoryCaps,
    hasStudied8hr,
    hasStudied6hr,
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

export async function recalculateDailyPoints(
  userId: string,
  logDate: string,
  db: Database
): Promise<void> {
  // 1. Get all logs for this user on this day, ordered by createdAt ASC
  const logs = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.logDate, logDate)
      )
    )
    .orderBy(activityLogs.createdAt);

  if (logs.length === 0) return;

  // 2. Check if 8hr or 6hr study is logged today to determine the positive cap
  const hasStudied8hr = logs.some((l) => l.activity === 'study_8hr');
  const hasStudied6hr = logs.some((l) => l.activity === 'study_6hr');
  
  let dailyCap = DAILY_POSITIVE_CAP;
  if (hasStudied8hr) {
    dailyCap = DAILY_POSITIVE_CAP_WITH_8HR_STUDY;
  } else if (hasStudied6hr) {
    dailyCap = DAILY_POSITIVE_CAP_WITH_6HR_STUDY;
  }

  let currentPositiveTotal = 0;
  const categoryPointsTotal: Record<string, number> = {};

  for (const log of logs) {
    // Skip retention logs — their points are managed by the retention service,
    // not the daily points engine. Never recalculate or cap them.
    if (log.category === 'retention') continue;

    const categoryDef = CATEGORIES[log.category as keyof typeof CATEGORIES];
    if (!categoryDef) continue;

    // A. Calculate base points (before daily cap constraints)
    let basePoints = 0;

    if (categoryDef.type === 'standard' || categoryDef.type === 'retention') {
      const activityDef = (categoryDef as any).activities?.[log.activity];
      const penaltyDef = (categoryDef as any).penalties?.[log.activity];

      if (activityDef) {
        basePoints = activityDef.points;
      } else if (penaltyDef) {
        if ('compounding' in penaltyDef) {
          const consecutiveDays = await getConsecutivePenaltyDays(userId, log.category, log.activity, logDate, db);
          basePoints = penaltyDef.basePoints + (penaltyDef.compounding * consecutiveDays);
        } else {
          basePoints = penaltyDef.points;
        }
      }
    }

    // B. Apply category daily cap and global positive daily cap
    let finalPoints = basePoints;

    if (basePoints > 0) {
      let allowedPoints = basePoints;

      // Check category daily cap
      if (categoryDef.maxDaily) {
        const currentCategoryTotal = categoryPointsTotal[log.category] ?? 0;
        const categoryHeadroom = categoryDef.maxDaily - currentCategoryTotal;
        if (categoryHeadroom <= 0) {
          allowedPoints = 0;
        } else if (allowedPoints > categoryHeadroom) {
          allowedPoints = categoryHeadroom;
        }
      }

      // Apply global cap
      const headroom = dailyCap - currentPositiveTotal;
      if (headroom <= 0) {
        finalPoints = 0;
      } else if (allowedPoints > headroom) {
        finalPoints = headroom;
      } else {
        finalPoints = allowedPoints;
      }

      currentPositiveTotal += finalPoints;
      categoryPointsTotal[log.category] = (categoryPointsTotal[log.category] ?? 0) + finalPoints;
    }

    // C. Update the database if the points calculated now differ from what is stored
    if (log.points !== finalPoints) {
      await db
        .update(activityLogs)
        .set({ points: finalPoints, updatedAt: new Date() })
        .where(eq(activityLogs.id, log.id));
    }
  }
}

export { CURRENT_RULES_VERSION };
