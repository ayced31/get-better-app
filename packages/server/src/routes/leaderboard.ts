import { Router } from 'express';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, activityLogs } from '../db/schema.js';
import { getISTDate, subtractDay, getRank } from '@get-better/shared';
import { authMiddleware } from '../middleware/auth.js';
import { calculateStreak } from '../services/streaks.js';
import { backfillAllUsers } from '../services/backfill.js';

const router = Router();

router.use(authMiddleware);

// ─── GET / ── Leaderboard ────────────────────────────────────────

router.get('/', async (req, res) => {
  // Batch run backfill for all users first so standings are always up to date
  await backfillAllUsers();

  const period = (req.query.period as string) ?? 'all';

  // Determine date range
  const today = getISTDate();
  let startDate: string;
  let endDate: string = today;

  switch (period) {
    case 'today':
      startDate = today;
      break;
    case 'week': {
      let d = today;
      for (let i = 0; i < 6; i++) d = subtractDay(d);
      startDate = d;
      break;
    }
    case 'month':
      startDate = today.substring(0, 7) + '-01';
      break;
    case 'all':
    default:
      startDate = '2000-01-01';
      break;
  }

  // Aggregate points per user
  const results = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      rawScore: sql<number>`COALESCE(SUM(${activityLogs.points}), 0)`.as('raw_score'),
      firstEntryTime: sql<string | null>`MIN(${activityLogs.createdAt})`.as('first_entry_time'),
    })
    .from(users)
    .leftJoin(
      activityLogs,
      and(
        eq(activityLogs.userId, users.id),
        gte(activityLogs.logDate, startDate),
        lte(activityLogs.logDate, endDate)
      )
    )
    .groupBy(users.id)
    .orderBy(sql`raw_score DESC`);

  // Get today's points and streaks for each user
  const entries = await Promise.all(
    results.map(async (row) => {
      const rawScore = Number(row.rawScore);
      const displayPoints = Math.max(0, rawScore);
      const rank = getRank(rawScore);

      // Get today's points
      const todayLogs = await db
        .select({ points: activityLogs.points })
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.userId, row.id),
            eq(activityLogs.logDate, today)
          )
        );
      const todayPoints = todayLogs.reduce((sum, l) => sum + l.points, 0);

      const streak = await calculateStreak(row.id, db);

      return {
        user: {
          id: row.id,
          username: row.username,
          email: row.email,
          displayName: row.displayName,
          avatarUrl: row.avatarUrl,
          createdAt: row.createdAt.toISOString(),
        },
        totalPoints: rawScore,
        displayPoints,
        rank: rank.name,
        rankEmoji: rank.emoji,
        todayPoints,
        streak,
        firstEntryTime: row.firstEntryTime ? new Date(row.firstEntryTime).getTime() : null,
      };
    })
  );

  // Sort by:
  // 1. displayPoints (descending)
  // 2. firstEntryTime (ascending - who logged first in the period)
  // 3. user registration date (ascending - who signed up first)
  entries.sort((a, b) => {
    if (b.displayPoints !== a.displayPoints) {
      return b.displayPoints - a.displayPoints;
    }

    const timeA = a.firstEntryTime ?? Infinity;
    const timeB = b.firstEntryTime ?? Infinity;
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    const regA = new Date(a.user.createdAt).getTime();
    const regB = new Date(b.user.createdAt).getTime();
    return regA - regB;
  });

  res.json({ success: true, data: entries });
});

export default router;
