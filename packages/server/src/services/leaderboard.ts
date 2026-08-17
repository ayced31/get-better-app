import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { users, activityLogs } from '../db/schema.js';
import { getISTDate, subtractDay, getRank, getCurrentSeason, type LeaderboardEntry } from '@get-better/shared';
import type { Database } from '../db/index.js';
import { calculateStreak } from './streaks.js';

export async function getLeaderboardEntries(period: string = 'all', db: Database): Promise<LeaderboardEntry[]> {
  const today = getISTDate();
  const season = getCurrentSeason();
  const seasonStart = season.seasonStart;
  const seasonEnd = season.seasonEnd && season.seasonEnd < today ? season.seasonEnd : today;

  let periodStartDate: string;
  let periodEndDate: string = today;

  switch (period) {
    case 'today':
      periodStartDate = today;
      break;
    case 'week': {
      let d = today;
      for (let i = 0; i < 6; i++) d = subtractDay(d);
      periodStartDate = d;
      break;
    }
    case 'month':
      periodStartDate = today.substring(0, 7) + '-01';
      break;
    case 'all':
    default:
      periodStartDate = seasonStart;
      periodEndDate = seasonEnd;
      break;
  }

  // Single query with LEFT JOIN scoped by season date bounds using idx_logs_user_date
  const results = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      periodScore: sql<number>`COALESCE(SUM(CASE WHEN ${activityLogs.logDate} >= ${periodStartDate} AND ${activityLogs.logDate} <= ${periodEndDate} THEN ${activityLogs.points} ELSE 0 END), 0)`.as('period_score'),
      seasonScore: sql<number>`COALESCE(SUM(${activityLogs.points}), 0)`.as('season_score'),
      todayScore: sql<number>`COALESCE(SUM(CASE WHEN ${activityLogs.logDate} = ${today} THEN ${activityLogs.points} ELSE 0 END), 0)`.as('today_score'),
      firstEntryTime: sql<string | null>`MIN(CASE WHEN ${activityLogs.logDate} >= ${periodStartDate} AND ${activityLogs.logDate} <= ${periodEndDate} THEN ${activityLogs.createdAt} ELSE NULL END)`.as('first_entry_time'),
    })
    .from(users)
    .leftJoin(
      activityLogs,
      and(
        eq(activityLogs.userId, users.id),
        gte(activityLogs.logDate, seasonStart),
        lte(activityLogs.logDate, seasonEnd)
      )
    )
    .groupBy(users.id);

  // Calculate streaks concurrently in parallel for all users
  const streakResults = await Promise.all(
    results.map((row) => calculateStreak(row.id, db))
  );

  const entries: (LeaderboardEntry & { firstEntryTime?: number | null })[] = results.map((row, idx) => {
    const periodScore = Number(row.periodScore);
    const seasonScore = Number(row.seasonScore);
    const todayPoints = Number(row.todayScore);
    const rank = getRank(seasonScore);
    const streak = streakResults[idx];

    return {
      user: {
        id: row.id,
        username: row.username,
        email: row.email,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        createdAt: row.createdAt.toISOString(),
      },
      totalPoints: seasonScore,
      displayPoints: periodScore,
      rank: rank.name,
      rankEmoji: rank.emoji,
      todayPoints,
      streak,
      firstEntryTime: row.firstEntryTime ? new Date(row.firstEntryTime).getTime() : null,
    };
  });

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

  return entries;
}
