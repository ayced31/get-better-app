import { db } from '../db';
import { users, activityLogs } from '../db/schema';
import { getISTDate, addDay, getDateRange } from '@get-better/shared';
import { calculatePoints } from './points';
import { and, eq } from 'drizzle-orm';

/**
 * Checks all dates from user registration to today.
 * If a date is in the past, past its 4:00 AM IST next-day threshold,
 * and has 0 activity logs, automatically logs a missed log day penalty.
 */
export async function backfillMissedDaysForUser(userId: string, dbClient: any = db) {
  // 1. Fetch user to get registration date
  const [user] = await dbClient
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return;

  const regDate = getISTDate(user.createdAt);
  const today = getISTDate();
  const allDates = getDateRange(regDate, today);

  for (const dateStr of allDates) {
    if (dateStr === today) {
      continue; // Today's tracking window is still open
    }

    // Cutoff is 4:00 AM IST of the day after dateStr (next calendar day)
    const nextDayStr = addDay(dateStr);
    const cutoffTime = new Date(`${nextDayStr}T04:00:00+05:30`);

    if (new Date() < cutoffTime) {
      continue; // Not yet past 4:00 AM of the next calendar day
    }

    // Check if user has logged anything (activities or manual/auto penalties)
    const existingLogs = await dbClient
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, userId), eq(activityLogs.logDate, dateStr)));

    if (existingLogs.length === 0) {
      try {
        const result = await calculatePoints(userId, 'daily_log', 'miss', dateStr, dbClient);
        await dbClient.insert(activityLogs).values({
          userId,
          logDate: dateStr,
          category: 'daily_log',
          activity: 'miss',
          points: result.points,
          rulesVersion: 'v1',
          metadata: { automatic: true },
        });
      } catch (err) {
        console.error(`Failed to auto-insert miss penalty for user ${userId} on ${dateStr}:`, err);
      }
    }
  }
}

/**
 * Backfills all users in the system. Used before leaderboard generation.
 */
export async function backfillAllUsers(dbClient: any = db) {
  try {
    const allUsers = await dbClient.select({ id: users.id }).from(users);
    for (const u of allUsers) {
      await backfillMissedDaysForUser(u.id, dbClient);
    }
  } catch (err) {
    console.error('Failed to run batch backfill for all users:', err);
  }
}
