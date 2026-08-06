import { eq, and, desc } from 'drizzle-orm';
import { activityLogs, retentionStatus } from '../db/schema.js';
import { getISTDate } from '@get-better/shared';
import type { Database } from '../db/index.js';
import type { RetentionStatus } from '@get-better/shared';

const RULES_VERSION = 'v2';

function calculateDaysElapsed(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T00:00:00Z');
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export async function getRetentionStatus(userId: string, db: Database): Promise<RetentionStatus> {
  const today = getISTDate();
  
  // 1. Get or create retention_status row
  let [status] = await db.select().from(retentionStatus).where(eq(retentionStatus.userId, userId));
  
  if (!status) {
    const [newStatus] = await db.insert(retentionStatus).values({
      userId,
      currentStreakStart: today,
      lastClaimedDays: 0,
    }).returning();
    status = newStatus;
  }

  const daysElapsed = calculateDaysElapsed(status.currentStreakStart, today);

  // 2. Get claimed milestones history
  const logs = await db
    .select({ id: activityLogs.id, activity: activityLogs.activity, points: activityLogs.points, createdAt: activityLogs.createdAt, logDate: activityLogs.logDate })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.category, 'retention')
      )
    )
    .orderBy(desc(activityLogs.createdAt));

  const milestoneLogs = logs.filter((l) => l.activity.startsWith('milestone_'));

  // Sync valid logs since last slip or currentStreakStart
  const lastSlip = logs.find((l) => l.activity === 'slip');
  let validMilestoneLogs = milestoneLogs;
  if (lastSlip) {
    validMilestoneLogs = milestoneLogs.filter((l) => l.createdAt > lastSlip.createdAt);
  } else {
    validMilestoneLogs = milestoneLogs.filter((l) => l.logDate >= status.currentStreakStart);
  }

  // Self-heal: repair any milestone logs whose points were zeroed out by the old recalculation bug
  for (const log of validMilestoneLogs) {
    const days = parseInt(log.activity.replace('milestone_', '').replace('d', ''), 10) || 0;
    const expectedPoints = (days / 7) * 2;
    if (days > 0 && log.points !== expectedPoints) {
      await db.update(activityLogs)
        .set({ points: expectedPoints, updatedAt: new Date() })
        .where(eq(activityLogs.id, log.id));
      log.points = expectedPoints;
    }
  }

  const claimedDaysSet = new Set(
    validMilestoneLogs.map((l) => parseInt(l.activity.replace('milestone_', '').replace('d', ''), 10) || 0)
  );

  // 3. Auto-award reached milestones based on elapsed days
  const newlyAwardedMilestones: { days: number; points: number }[] = [];

  for (let m = 7; m <= daysElapsed; m += 7) {
    if (!claimedDaysSet.has(m)) {
      const points = (m / 7) * 2;
      const activity = `milestone_${m}d`;

      await db.insert(activityLogs).values({
        userId,
        logDate: today,
        category: 'retention',
        activity,
        points,
        rulesVersion: RULES_VERSION,
      });

      claimedDaysSet.add(m);
      newlyAwardedMilestones.push({ days: m, points });
    }
  }

  const claimedMilestones = Array.from(claimedDaysSet)
    .sort((a, b) => b - a)
    .map((days) => ({
      days,
      points: (days / 7) * 2,
      claimedAt: new Date().toISOString(),
    }));

  const maxClaimed = claimedDaysSet.size > 0 ? Math.max(...Array.from(claimedDaysSet)) : 0;
  
  if (maxClaimed !== status.lastClaimedDays) {
    await db.update(retentionStatus)
      .set({ lastClaimedDays: maxClaimed, updatedAt: new Date() })
      .where(eq(retentionStatus.userId, userId));
  }

  const nextMilestoneDays = Math.max(7, (Math.floor(maxClaimed / 7) + 1) * 7);
  const nextMilestonePoints = (nextMilestoneDays / 7) * 2;

  // 4. Build Slips list & Streak Sessions History
  const allLogsAsc = await db
    .select({
      id: activityLogs.id,
      activity: activityLogs.activity,
      points: activityLogs.points,
      logDate: activityLogs.logDate,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.category, 'retention')
      )
    )
    .orderBy(activityLogs.createdAt);

  const hasStarted = allLogsAsc.length > 0 || status.lastClaimedDays > 0;
  const actualDaysElapsed = hasStarted ? daysElapsed : 0;

  const slips = allLogsAsc
    .filter((l) => l.activity === 'slip')
    .map((l) => ({
      id: l.id,
      logDate: l.logDate,
      createdAt: l.createdAt.toISOString(),
    }));

  const streakSessions: any[] = [];
  let currentGroup: typeof allLogsAsc = [];
  let sessionIndex = 1;

  for (const log of allLogsAsc) {
    if (log.activity === 'slip') {
      const milestoneLogs = currentGroup.filter((l) => l.activity.startsWith('milestone_'));
      const daysList = milestoneLogs.map((l) => parseInt(l.activity.replace('milestone_', '').replace('d', ''), 10) || 0);
      const maxDays = daysList.length > 0 ? Math.max(...daysList) : 0;
      const totalPoints = milestoneLogs.reduce((sum, l) => sum + l.points, 0);
      const startDate = milestoneLogs.length > 0 ? milestoneLogs[0].logDate : log.logDate;

      streakSessions.push({
        id: `past-session-${sessionIndex++}`,
        startDate,
        endDate: log.logDate,
        maxDays,
        totalPoints,
        milestonesCount: milestoneLogs.length,
        isCurrent: false,
        slipLogId: log.id,
      });
      currentGroup = [];
    } else if (log.activity.startsWith('milestone_')) {
      currentGroup.push(log);
    }
  }

  // Add active current streak session at top if streak has started
  if (hasStarted) {
    streakSessions.unshift({
      id: 'current-session',
      startDate: status.currentStreakStart,
      endDate: null,
      maxDays: actualDaysElapsed,
      totalPoints: validMilestoneLogs.reduce((sum, l) => sum + l.points, 0),
      milestonesCount: validMilestoneLogs.length,
      isCurrent: true,
    });
  }

  return {
    currentStreakStart: hasStarted ? status.currentStreakStart : null,
    daysElapsed: actualDaysElapsed,
    nextMilestoneDays,
    nextMilestonePoints,
    hasStarted,
    claimedMilestones,
    slips,
    streakSessions,
    ...(newlyAwardedMilestones.length > 0 ? { newlyAwardedMilestones } : {}),
  };
}

export async function startRetentionStreak(userId: string, startDate: string | undefined, db: Database) {
  const today = getISTDate();
  const start = startDate || today;

  // Insert streak_start activity log to record explicit user start action
  await db.insert(activityLogs).values({
    userId,
    logDate: start,
    category: 'retention',
    activity: 'streak_start',
    points: 0,
    rulesVersion: RULES_VERSION,
  });

  await db.insert(retentionStatus)
    .values({
      userId,
      currentStreakStart: start,
      lastClaimedDays: 0,
    })
    .onConflictDoUpdate({
      target: retentionStatus.userId,
      set: {
        currentStreakStart: start,
        lastClaimedDays: 0,
        updatedAt: new Date(),
      },
    });

  return await getRetentionStatus(userId, db);
}

export async function claimMilestone(userId: string, db: Database) {
  return await getRetentionStatus(userId, db);
}

export async function logSlip(userId: string, db: Database) {
  const today = getISTDate();

  // Insert log entry for the slip
  await db.insert(activityLogs).values({
    userId,
    logDate: today,
    category: 'retention',
    activity: 'slip',
    points: 0,
    rulesVersion: RULES_VERSION,
  });
  
  // Reset target streak start to today
  await db.update(retentionStatus)
    .set({
      currentStreakStart: today,
      lastClaimedDays: 0,
      updatedAt: new Date(),
    })
    .where(eq(retentionStatus.userId, userId));
    
  return await getRetentionStatus(userId, db);
}

export async function deleteRetentionSlip(userId: string, slipId: string, db: Database) {
  // Delete the slip log entry
  await db.delete(activityLogs).where(
    and(
      eq(activityLogs.id, slipId),
      eq(activityLogs.userId, userId),
      eq(activityLogs.category, 'retention')
    )
  );

  // Find remaining retention logs to restore start date
  const remainingLogs = await db
    .select({ activity: activityLogs.activity, logDate: activityLogs.logDate, createdAt: activityLogs.createdAt })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.category, 'retention')
      )
    )
    .orderBy(desc(activityLogs.createdAt));

  const lastSlip = remainingLogs.find((l) => l.activity === 'slip');
  const streakStartLog = remainingLogs.find((l) => l.activity === 'streak_start');

  const newStart = lastSlip
    ? lastSlip.logDate
    : streakStartLog
    ? streakStartLog.logDate
    : getISTDate();

  await db.update(retentionStatus)
    .set({ currentStreakStart: newStart, updatedAt: new Date() })
    .where(eq(retentionStatus.userId, userId));

  return await getRetentionStatus(userId, db);
}

export async function updateRetentionSlip(userId: string, slipId: string, newDate: string, db: Database) {
  await db.update(activityLogs)
    .set({ logDate: newDate, updatedAt: new Date() })
    .where(
      and(
        eq(activityLogs.id, slipId),
        eq(activityLogs.userId, userId),
        eq(activityLogs.category, 'retention')
      )
    );

  const remainingLogs = await db
    .select({ activity: activityLogs.activity, logDate: activityLogs.logDate, createdAt: activityLogs.createdAt })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.category, 'retention')
      )
    )
    .orderBy(desc(activityLogs.createdAt));

  const lastSlip = remainingLogs.find((l) => l.activity === 'slip');
  if (lastSlip) {
    await db.update(retentionStatus)
      .set({ currentStreakStart: lastSlip.logDate, updatedAt: new Date() })
      .where(eq(retentionStatus.userId, userId));
  }

  return await getRetentionStatus(userId, db);
}
