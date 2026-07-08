import { Router } from 'express';
import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, activityLogs } from '../db/schema.js';
import { getISTDate, getRank, getRankProgress, getMonthStart, getMonthEnd } from '@get-better/shared';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { calculateStreak } from '../services/streaks.js';
import { backfillMissedDaysForUser } from '../services/backfill.js';

const router = Router();

router.use(authMiddleware);

// ─── GET /:id/stats ── Full user stats ───────────────────────────

router.get('/:id/stats', async (req: AuthRequest, res) => {
  const userId = (req.params.id === 'me' ? req.userId! : req.params.id) as string;

  // Get user
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  // Run backfill first to keep streaks and cumulative scores accurate
  await backfillMissedDaysForUser(userId);

  // Get total points (all time)
  const [totalResult] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${activityLogs.points}), 0)`,
    })
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId));

  const totalPoints = Number(totalResult.total);
  const displayPoints = Math.max(0, totalPoints);
  const rank = getRank(totalPoints);
  const progress = getRankProgress(totalPoints);

  // Get streak
  const streak = await calculateStreak(userId, db);

  // Get today's data
  const today = getISTDate();
  const todayLogs = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.userId, userId), eq(activityLogs.logDate, today)))
    .orderBy(desc(activityLogs.createdAt));

  const todayPoints = todayLogs.reduce((sum, l) => sum + l.points, 0);

  // Get monthly breakdown (current or specified month)
  const targetMonthStr = typeof req.query.month === 'string' ? req.query.month + '-01' : today;
  const monthStart = getMonthStart(targetMonthStr);
  const monthEnd = getMonthEnd(targetMonthStr);

  const monthlyLogs = await db
    .select({
      date: activityLogs.logDate,
      points: sql<number>`SUM(${activityLogs.points})`,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        sql`${activityLogs.logDate} >= ${monthStart}`,
        sql`${activityLogs.logDate} <= ${monthEnd}`
      )
    )
    .groupBy(activityLogs.logDate)
    .orderBy(activityLogs.logDate);

  // Fetch raw logs for this month to calculate detailed statistics
  const monthlyRawLogs = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        sql`${activityLogs.logDate} >= ${monthStart}`,
        sql`${activityLogs.logDate} <= ${monthEnd}`
      )
    );

  let workoutCount = 0;
  let studyHours = 0;
  let slipsCount = 0;
  let missesCount = 0;
  let lateSleepCount = 0;

  for (const log of monthlyRawLogs) {
    if (log.category === 'physical' && ['gym', 'steps_10k', 'yoga'].includes(log.activity)) {
      workoutCount++;
    }
    if (log.category === 'study') {
      if (log.activity === 'study_2hr') studyHours += 2;
      else if (log.activity === 'study_4hr') studyHours += 4;
      else if (log.activity === 'study_8hr') studyHours += 8;
    }
    if (log.category === 'masturbation') {
      slipsCount++;
    }
    if (log.category === 'daily_log' && log.activity === 'miss') {
      missesCount++;
    }
    if (log.category === 'sleep' && log.activity === 'late_sleep') {
      lateSleepCount++;
    }
  }

  res.json({
    success: true,
    data: {
      user: { ...user, createdAt: user.createdAt.toISOString() },
      totalPoints,
      displayPoints,
      rank: rank.name,
      rankEmoji: rank.emoji,
      rankProgress: progress.progress,
      nextRank: progress.next?.name ?? null,
      streak,
      todayPoints,
      todayLogs: todayLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      monthlyBreakdown: monthlyLogs.map((l) => ({
        date: l.date,
        points: Number(l.points),
      })),
      monthlyStats: {
        workoutCount,
        studyHours,
        slipsCount,
        missesCount,
        lateSleepCount,
      },
    },
  });
});

export default router;
