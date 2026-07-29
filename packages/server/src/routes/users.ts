import { Router } from 'express';
import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, activityLogs } from '../db/schema.js';
import { getISTDate, getRank, getRankProgress, getMonthStart, getMonthEnd, getCurrentSeason, subtractDay } from '@get-better/shared';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { calculateStreak } from '../services/streaks.js';
import { backfillMissedDaysForUser } from '../services/backfill.js';

import bcrypt from 'bcrypt';

const router = Router();

router.use(authMiddleware);

// ─── GET /:id/stats ── Full user stats ───────────────────────────

router.get('/:id/stats', async (req: AuthRequest, res) => {
  const userId = (req.params.id === 'me' ? req.userId! : req.params.id) as string;

  // Run backfill (throttled inside backfillMissedDaysForUser)
  await backfillMissedDaysForUser(userId);

  const today = getISTDate();
  const currentSeason = getCurrentSeason();
  const targetMonthStr = typeof req.query.month === 'string' ? req.query.month + '-01' : today;
  const monthStart = getMonthStart(targetMonthStr);
  const monthEnd = getMonthEnd(targetMonthStr);

  // Execute independent queries in parallel via Promise.all
  const [
    userResult,
    totalResult,
    streak,
    todayLogs,
    monthlyRawLogs,
    prevTotalResult,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId)),

    db
      .select({
        total: sql<number>`COALESCE(SUM(${activityLogs.points}), 0)`,
      })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, userId),
          sql`${activityLogs.logDate} >= ${currentSeason.seasonStart}`
        )
      ),

    calculateStreak(userId, db),

    db
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, userId), eq(activityLogs.logDate, today)))
      .orderBy(desc(activityLogs.createdAt)),

    db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, userId),
          sql`${activityLogs.logDate} >= ${monthStart}`,
          sql`${activityLogs.logDate} <= ${monthEnd}`
        )
      ),

    currentSeason.seasonNumber > 1
      ? db
          .select({
            total: sql<number>`COALESCE(SUM(${activityLogs.points}), 0)`,
          })
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.userId, userId),
              sql`${activityLogs.logDate} >= ${getCurrentSeason(subtractDay(currentSeason.seasonStart)).seasonStart}`,
              sql`${activityLogs.logDate} <= ${getCurrentSeason(subtractDay(currentSeason.seasonStart)).seasonEnd}`
            )
          )
      : Promise.resolve([{ total: 0 }]),
  ]);

  const user = userResult[0];
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const totalPoints = Number(totalResult[0]?.total ?? 0);
  const displayPoints = totalPoints;
  const rank = getRank(totalPoints);
  const progress = getRankProgress(totalPoints);
  const todayPoints = todayLogs.reduce((sum, l) => sum + l.points, 0);

  let previousSeasonRank = null;
  if (currentSeason.seasonNumber > 1) {
    previousSeasonRank = getRank(Number(prevTotalResult[0]?.total ?? 0)).name;
  }

  // Calculate monthly breakdown and statistics in-memory from monthlyRawLogs
  const monthlyPointsByDate = new Map<string, number>();
  let workoutCount = 0;
  let studyHours = 0;
  let slipsCount = 0;
  let missesCount = 0;
  let lateSleepCount = 0;

  for (const log of monthlyRawLogs) {
    const currentSum = monthlyPointsByDate.get(log.logDate) || 0;
    monthlyPointsByDate.set(log.logDate, currentSum + log.points);

    if (log.category === 'physical' && ['gym', 'steps_10k', 'running_3km', 'calisthenics'].includes(log.activity)) {
      workoutCount++;
    }
    if (log.category === 'study') {
      if (log.activity === 'study_2hr') studyHours += 2;
      else if (log.activity === 'study_4hr') studyHours += 4;
      else if (log.activity === 'study_6hr') studyHours += 6;
      else if (log.activity === 'study_8hr') studyHours += 8;
    }
    if (log.category === 'retention' || log.category === 'masturbation') {
      slipsCount++;
    }
    if (log.category === 'daily_log' && log.activity === 'miss') {
      missesCount++;
    }
    if (log.category === 'sleep' && log.activity === 'sleep_after_3am') {
      lateSleepCount++;
    }
  }

  const monthlyBreakdown = Array.from(monthlyPointsByDate.entries())
    .map(([date, points]) => ({ date, points }))
    .sort((a, b) => a.date.localeCompare(b.date));

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
      previousSeasonRank,
      streak,
      todayPoints,
      todayLogs: todayLogs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      monthlyBreakdown,
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

// ─── PATCH /me/profile ── Update display name or password ──────────

router.patch('/me/profile', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { displayName, currentPassword, newPassword } = req.body;

  // Retrieve user to check current password if resetting
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  const updates: Record<string, any> = { updatedAt: new Date() };

  // 1. Display Name Update
  if (displayName !== undefined) {
    updates.displayName = typeof displayName === 'string' ? displayName.trim() || null : null;
  }

  // 2. Password Update
  if (newPassword !== undefined && newPassword !== '') {
    if (!currentPassword) {
      res.status(400).json({ success: false, error: 'Current password is required to change password' });
      return;
    }
    
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid current password' });
      return;
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
    updates.passwordHash = await bcrypt.hash(newPassword, saltRounds);
  }

  // Perform updates
  const [updatedUser] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    });

  res.json({
    success: true,
    data: {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
    },
  });
});

// ─── DELETE /me ── Delete the authenticated user account ──────────
router.delete('/me', async (req: AuthRequest, res) => {
  const userId = req.userId!;

  try {
    await db.delete(activityLogs).where(eq(activityLogs.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

export default router;
