import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { activityLogs } from '../db/schema.js';
import { getISTDate, subtractDay } from '@get-better/shared';
import type { Database } from '../db/index.js';
import { CURRENT_RULES_VERSION } from './points.js';

/**
 * Calculate the current streak for a user.
 * A streak is the number of consecutive days (backwards from today/yesterday) with ≥1 active log.
 */
export async function calculateStreak(userId: string, db: Database): Promise<number> {
  const logDates = await db
    .selectDistinct({ date: activityLogs.logDate })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        sql`${activityLogs.category} NOT IN ('daily_log', 'retention', 'streak_bonus')`,
        sql`${activityLogs.activity} NOT IN ('miss', 'no_study', 'workout_gap')`,
        sql`(${activityLogs.metadata} IS NULL OR (${activityLogs.metadata}->>'automatic') IS NULL OR (${activityLogs.metadata}->>'automatic') != 'true')`
      )
    )
    .orderBy(desc(activityLogs.logDate));

  if (logDates.length === 0) return 0;

  const today = getISTDate();
  const yesterday = subtractDay(today);

  // If latest user log is older than yesterday, streak is completely broken (0)
  const latestLogDate = logDates[0].date;
  if (latestLogDate !== today && latestLogDate !== yesterday) {
    return 0;
  }

  let streak = 0;
  let expected = latestLogDate;

  for (const row of logDates) {
    if (row.date === expected) {
      streak++;
      expected = subtractDay(expected);
    } else {
      // Gap found — streak broken
      break;
    }
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
  const yesterday = subtractDay(today);
  const monthStart = today.substring(0, 7) + '-01';

  const logDates = await db
    .selectDistinct({ date: activityLogs.logDate })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        sql`${activityLogs.logDate} >= ${monthStart}`,
        sql`${activityLogs.logDate} <= ${today}`,
        sql`${activityLogs.category} NOT IN ('daily_log', 'retention', 'streak_bonus')`,
        sql`${activityLogs.activity} NOT IN ('miss', 'no_study', 'workout_gap')`,
        sql`(${activityLogs.metadata} IS NULL OR (${activityLogs.metadata}->>'automatic') IS NULL OR (${activityLogs.metadata}->>'automatic') != 'true')`
      )
    )
    .orderBy(desc(activityLogs.logDate));

  if (logDates.length === 0) return 0;

  const latestLogDate = logDates[0].date;
  if (latestLogDate !== today && latestLogDate !== yesterday) {
    return 0;
  }

  let streak = 0;
  let expected = latestLogDate;

  for (const row of logDates) {
    if (row.date === expected) {
      streak++;
      expected = subtractDay(expected);
      if (expected < monthStart) break;
    } else {
      break;
    }
  }

  return streak;
}

export async function checkHighScoreStreak(
  userId: string,
  logDate: string,
  db: Database
): Promise<{ awarded: boolean; bonus: number; type: '7pt' | '8pt' | null }> {
  // Looks back 6 days from logDate (inclusive)
  let startDate = logDate;
  for (let i = 0; i < 5; i++) {
    startDate = subtractDay(startDate);
  }

  const logs = await db
    .select({
      logDate: activityLogs.logDate,
      points: activityLogs.points,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        sql`${activityLogs.logDate} >= ${startDate}`,
        sql`${activityLogs.logDate} <= ${logDate}`,
        sql`${activityLogs.category} NOT IN ('retention', 'streak_bonus')`
      )
    );

  const dailyPoints: Record<string, number> = {};
  for (const log of logs) {
    dailyPoints[log.logDate] = (dailyPoints[log.logDate] || 0) + log.points;
  }

  let all8pt = true;
  let all7pt = true;

  let checkDate = logDate;
  for (let i = 0; i < 6; i++) {
    const pts = dailyPoints[checkDate] || 0;
    if (pts < 8) all8pt = false;
    if (pts < 7) all7pt = false;
    checkDate = subtractDay(checkDate);
  }

  if (!all7pt && !all8pt) {
    return { awarded: false, bonus: 0, type: null };
  }

  const type = all8pt ? '8pt' : '7pt';
  const bonus = all8pt ? 4 : 2;
  const activityStr = all8pt ? 'high_score_8pt' : 'high_score_7pt';

  // Check for duplicate bonuses
  const existing = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.logDate, logDate),
        eq(activityLogs.category, 'streak_bonus')
      )
    );

  if (existing.length > 0) {
    const currentBonus = existing[0];
    if (currentBonus.activity === activityStr) {
      // Already awarded this exact one
      return { awarded: false, bonus: 0, type: null };
    } else {
      // Upgrading from 7pt to 8pt or vice versa
      await db
        .update(activityLogs)
        .set({
          activity: activityStr,
          points: bonus,
          updatedAt: new Date()
        })
        .where(eq(activityLogs.id, currentBonus.id));
      
      return { awarded: true, bonus, type };
    }
  }

  // Insert new bonus
  await db.insert(activityLogs).values({
    userId,
    logDate,
    category: 'streak_bonus',
    activity: activityStr,
    points: bonus,
    rulesVersion: CURRENT_RULES_VERSION,
  });

  return { awarded: true, bonus, type };
}
