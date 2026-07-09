import { db } from '../db/index.js';
import { users, activityLogs } from '../db/schema.js';
import { getISTDate, addDay, getDateRange, subtractDay } from '@get-better/shared';
import { calculatePoints, recalculateDailyPoints } from './points.js';
import { and, eq } from 'drizzle-orm';

async function checkHasWorkout(userId: string, dateStr: string, dbClient: any): Promise<boolean> {
  const logs = await dbClient
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.logDate, dateStr),
        eq(activityLogs.category, 'physical')
      )
    );
  return logs.some((l: any) => l.activity !== 'workout_gap');
}

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

    // A. Fetch existing logs for this date first to run auto-penalties (which start at 12:00 AM, i.e. when dateStr < today)
    const dayLogs = await dbClient
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, userId), eq(activityLogs.logDate, dateStr)));

    // 1. Check No Study penalty: user logged other activities but no study log
    const userLoggedActivities = dayLogs.filter(
      (l: any) =>
        (l.category !== 'daily_log' || l.activity !== 'miss') &&
        (l.category !== 'study' || l.activity !== 'no_study') &&
        (l.category !== 'physical' || l.activity !== 'workout_gap') &&
        (!l.metadata || !(l.metadata as any).automatic)
    );
    const hasStudyLog = dayLogs.some((l: any) => l.category === 'study' && l.activity !== 'no_study');
    const noStudyPenalty = dayLogs.find((l: any) => l.category === 'study' && l.activity === 'no_study');

    if (userLoggedActivities.length > 0 && !hasStudyLog) {
      if (!noStudyPenalty) {
        try {
          const result = await calculatePoints(userId, 'study', 'no_study', dateStr, dbClient);
          await dbClient.insert(activityLogs).values({
            userId,
            logDate: dateStr,
            category: 'study',
            activity: 'no_study',
            points: result.points,
            rulesVersion: 'v1',
            metadata: { automatic: true },
          });
          await recalculateDailyPoints(userId, dateStr, dbClient);
        } catch (err) {
          console.error(`Failed to auto-insert no_study penalty for user ${userId} on ${dateStr}:`, err);
        }
      }
    } else {
      if (noStudyPenalty) {
        try {
          await dbClient
            .delete(activityLogs)
            .where(eq(activityLogs.id, noStudyPenalty.id));
          await recalculateDailyPoints(userId, dateStr, dbClient);
        } catch (err) {
          console.error(`Failed to remove no_study penalty for user ${userId} on ${dateStr}:`, err);
        }
      }
    }

    // 2. Check Workout Gap penalty: 3 consecutive days of no physical activity
    const hasWorkoutToday = dayLogs.some((l: any) => l.category === 'physical' && l.activity !== 'workout_gap');
    const workoutGapPenalty = dayLogs.find((l: any) => l.category === 'physical' && l.activity === 'workout_gap');

    if (!hasWorkoutToday) {
      const dayMinus1 = subtractDay(dateStr);
      const dayMinus2 = subtractDay(dayMinus1);

      if (dayMinus2 >= regDate) {
        const hasWorkoutDay1 = await checkHasWorkout(userId, dayMinus1, dbClient);
        const hasWorkoutDay2 = await checkHasWorkout(userId, dayMinus2, dbClient);

        if (!hasWorkoutDay1 && !hasWorkoutDay2) {
          if (!workoutGapPenalty) {
            try {
              const result = await calculatePoints(userId, 'physical', 'workout_gap', dateStr, dbClient);
              await dbClient.insert(activityLogs).values({
                userId,
                logDate: dateStr,
                category: 'physical',
                activity: 'workout_gap',
                points: result.points,
                rulesVersion: 'v1',
                metadata: { automatic: true },
              });
              await recalculateDailyPoints(userId, dateStr, dbClient);
            } catch (err) {
              console.error(`Failed to auto-insert workout_gap penalty for user ${userId} on ${dateStr}:`, err);
            }
          }
        } else {
          if (workoutGapPenalty) {
            try {
              await dbClient
                .delete(activityLogs)
                .where(eq(activityLogs.id, workoutGapPenalty.id));
              await recalculateDailyPoints(userId, dateStr, dbClient);
            } catch (err) {
              console.error(`Failed to remove workout_gap penalty for user ${userId} on ${dateStr}:`, err);
            }
          }
        }
      }
    } else {
      if (workoutGapPenalty) {
        try {
          await dbClient
            .delete(activityLogs)
            .where(eq(activityLogs.id, workoutGapPenalty.id));
          await recalculateDailyPoints(userId, dateStr, dbClient);
        } catch (err) {
          console.error(`Failed to remove workout_gap penalty for user ${userId} on ${dateStr}:`, err);
        }
      }
    }

    // B. Check Cutoff-based Daily Log Miss Penalty (only runs after 4:00 AM threshold)
    const nextDayStr = addDay(dateStr);
    const cutoffTime = new Date(`${nextDayStr}T04:00:00+05:30`);

    if (new Date() < cutoffTime) {
      continue; // Not yet past 4:00 AM of the next calendar day
    }

    // Refresh existing logs (in case no_study or workout_gap was added, which makes length > 0)
    // Wait, the daily log miss penalty ONLY applies if the user logged ABSOLUTELY NOTHING of their own choice.
    // So we check if userLoggedActivities is 0!
    if (userLoggedActivities.length === 0) {
      // Check if a miss penalty is already logged
      const hasMissPenalty = dayLogs.some((l: any) => l.category === 'daily_log' && l.activity === 'miss');
      if (!hasMissPenalty) {
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
    } else {
      // If there are user logged activities but a miss penalty exists, delete it
      const missPenalty = dayLogs.find((l: any) => l.category === 'daily_log' && l.activity === 'miss');
      if (missPenalty) {
        try {
          await dbClient.delete(activityLogs).where(eq(activityLogs.id, missPenalty.id));
        } catch (err) {
          console.error(`Failed to remove miss penalty for user ${userId} on ${dateStr}:`, err);
        }
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
