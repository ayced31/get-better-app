import { eq, and, desc, sql } from 'drizzle-orm';
import { activityLogs } from '../db/schema.js';
import { getISTDate, subtractDay } from '@get-better/shared';
import type { Database } from '../db/index.js';

/**
 * Calculate the current streak for a user.
 * A streak is the number of consecutive days (backwards from today) with ≥1 log.
 */
export async function calculateStreak(userId: string, db: Database): Promise<number> {
  // Get all distinct dates where user has ≥1 log, ordered descending
  const logDates = await db
    .selectDistinct({ date: activityLogs.logDate })
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.logDate));

  if (logDates.length === 0) return 0;

  let streak = 0;
  let expected = getISTDate(); // today in IST

  for (const row of logDates) {
    if (row.date === expected) {
      streak++;
      expected = subtractDay(expected);
    } else if (row.date < expected) {
      // Gap found — streak broken
      break;
    }
    // If row.date > expected, skip (future dates shouldn't exist but be safe)
  }

  return streak;
}

/**
 * Calculate the daily log streak for the current month.
 * Resets at the start of each month per RULES.md.
 */
export async function calculateMonthlyLogStreak(
  userId: string,
  db: Database,
  referenceDate?: string
): Promise<number> {
  const today = referenceDate ?? getISTDate();
  const monthStart = today.substring(0, 7) + '-01';

  const logDates = await db
    .selectDistinct({ date: activityLogs.logDate })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        sql`${activityLogs.logDate} >= ${monthStart}`,
        sql`${activityLogs.logDate} <= ${today}`
      )
    )
    .orderBy(desc(activityLogs.logDate));

  if (logDates.length === 0) return 0;

  let streak = 0;
  let expected = today;

  for (const row of logDates) {
    if (row.date === expected) {
      streak++;
      expected = subtractDay(expected);
      // Don't go past month boundary
      if (expected < monthStart) break;
    } else {
      break;
    }
  }

  return streak;
}
