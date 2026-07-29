import { db } from '../db/index.js';
import { users, activityLogs } from '../db/schema.js';
import { getISTDate, addDay, getDateRange, subtractDay } from '@get-better/shared';
import { calculatePoints, recalculateDailyPoints } from './points.js';
import { and, eq, lte, gte } from 'drizzle-orm';

// In-memory cache to prevent re-running backfill on every single request
const userLastBackfill = new Map<string, number>();
const BACKFILL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

let lastAllUsersBackfill = 0;
const ALL_USERS_BACKFILL_TTL_MS = 10 * 60 * 1000; // 10 minutes cache for global backfill

function checkHasWorkoutInMemory(logsByDate: Map<string, any[]>, dateStr: string): boolean {
  const dayLogs = logsByDate.get(dateStr) || [];
  return dayLogs.some((l: any) => l.category === 'physical' && l.activity !== 'workout_gap');
}

function getConsecutiveMissedDaysInMemory(logsByDate: Map<string, any[]>, dateStr: string): number {
  let count = 0;
  let checkDate = subtractDay(dateStr);
  for (let i = 0; i < 30; i++) {
    const dayLogs = logsByDate.get(checkDate) || [];
    const hasMiss = dayLogs.some((l: any) => l.category === 'daily_log' && l.activity === 'miss');
    if (hasMiss) {
      count++;
      checkDate = subtractDay(checkDate);
    } else {
      break;
    }
  }
  return count;
}

/**
 * Checks all dates from user registration to today.
 * Single batch query fetches all user logs into memory to eliminate N+1 database queries.
 */
export async function backfillMissedDaysForUser(userId: string, dbClient: any = db, force: boolean = false) {
  const now = Date.now();
  const lastRun = userLastBackfill.get(userId) || 0;
  if (!force && now - lastRun < BACKFILL_CACHE_TTL_MS) {
    return; // Skip — backfilled recently
  }
  userLastBackfill.set(userId, now);

  // 1. Fetch user to get registration date
  const [user] = await dbClient
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return;

  const regDate = getISTDate(user.createdAt);
  const today = getISTDate();
  const allDates = getDateRange(regDate, today);

  // 2. Fetch ALL activity logs for this user in a SINGLE database query
  const allUserLogs = await dbClient
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId));

  // 3. Group logs by date in memory
  const logsByDate = new Map<string, any[]>();
  for (const log of allUserLogs) {
    const list = logsByDate.get(log.logDate) || [];
    list.push(log);
    logsByDate.set(log.logDate, list);
  }

  for (const dateStr of allDates) {
    if (dateStr === today) {
      continue; // Today's tracking window is still open
    }

    const dayLogs = logsByDate.get(dateStr) || [];

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
          const [inserted] = await dbClient.insert(activityLogs).values({
            userId,
            logDate: dateStr,
            category: 'study',
            activity: 'no_study',
            points: result.points,
            rulesVersion: 'v2',
            metadata: { automatic: true },
          }).returning();
          dayLogs.push(inserted);
          logsByDate.set(dateStr, dayLogs);
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
          const updated = dayLogs.filter((l: any) => l.id !== noStudyPenalty.id);
          logsByDate.set(dateStr, updated);
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
        const hasWorkoutDay1 = checkHasWorkoutInMemory(logsByDate, dayMinus1);
        const hasWorkoutDay2 = checkHasWorkoutInMemory(logsByDate, dayMinus2);

        if (!hasWorkoutDay1 && !hasWorkoutDay2) {
          if (!workoutGapPenalty) {
            try {
              const result = await calculatePoints(userId, 'physical', 'workout_gap', dateStr, dbClient);
              const [inserted] = await dbClient.insert(activityLogs).values({
                userId,
                logDate: dateStr,
                category: 'physical',
                activity: 'workout_gap',
                points: result.points,
                rulesVersion: 'v2',
                metadata: { automatic: true },
              }).returning();
              dayLogs.push(inserted);
              logsByDate.set(dateStr, dayLogs);
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
              const updated = dayLogs.filter((l: any) => l.id !== workoutGapPenalty.id);
              logsByDate.set(dateStr, updated);
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
          const updated = dayLogs.filter((l: any) => l.id !== workoutGapPenalty.id);
          logsByDate.set(dateStr, updated);
          await recalculateDailyPoints(userId, dateStr, dbClient);
        } catch (err) {
          console.error(`Failed to remove workout_gap penalty for user ${userId} on ${dateStr}:`, err);
        }
      }
    }

    // 3. Check Cutoff-based Daily Log Miss Penalty (only runs after 4:00 AM threshold)
    const nextDayStr = addDay(dateStr);
    const cutoffTime = new Date(`${nextDayStr}T04:00:00+05:30`);

    if (new Date() < cutoffTime) {
      continue; // Not yet past 4:00 AM of the next calendar day
    }

    if (userLoggedActivities.length === 0) {
      const hasMissPenalty = dayLogs.some((l: any) => l.category === 'daily_log' && l.activity === 'miss');
      if (!hasMissPenalty) {
        try {
          const MISS_BASE_POINTS = -1;
          const MISS_COMPOUNDING = -1;
          const consecutiveMisses = getConsecutiveMissedDaysInMemory(logsByDate, dateStr);
          const points = MISS_BASE_POINTS + (consecutiveMisses * MISS_COMPOUNDING);

          const [inserted] = await dbClient.insert(activityLogs).values({
            userId,
            logDate: dateStr,
            category: 'daily_log',
            activity: 'miss',
            points: points,
            rulesVersion: 'v2',
            metadata: { automatic: true },
          }).returning();
          dayLogs.push(inserted);
          logsByDate.set(dateStr, dayLogs);
        } catch (err) {
          console.error(`Failed to auto-insert miss penalty for user ${userId} on ${dateStr}:`, err);
        }
      }
    } else {
      const missPenalty = dayLogs.find((l: any) => l.category === 'daily_log' && l.activity === 'miss');
      if (missPenalty) {
        try {
          await dbClient.delete(activityLogs).where(eq(activityLogs.id, missPenalty.id));
          const updated = dayLogs.filter((l: any) => l.id !== missPenalty.id);
          logsByDate.set(dateStr, updated);
        } catch (err) {
          console.error(`Failed to remove miss penalty for user ${userId} on ${dateStr}:`, err);
        }
      }
    }
  }
}

/**
 * Backfills all users in the system (throttled).
 */
export async function backfillAllUsers(dbClient: any = db) {
  const now = Date.now();
  if (now - lastAllUsersBackfill < ALL_USERS_BACKFILL_TTL_MS) {
    return; // Skip global backfill if completed recently
  }
  lastAllUsersBackfill = now;

  try {
    const allUsers = await dbClient.select({ id: users.id }).from(users);
    await Promise.all(allUsers.map((u: any) => backfillMissedDaysForUser(u.id, dbClient, true)));
  } catch (err) {
    console.error('Failed to run batch backfill for all users:', err);
  }
}
