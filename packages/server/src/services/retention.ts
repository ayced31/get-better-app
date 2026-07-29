import { eq, and, desc } from 'drizzle-orm';
import { activityLogs, retentionStatus } from '../db/schema.js';
import { getISTDate } from '@get-better/shared';
import type { Database } from '../db/index.js';
import type { RetentionStatus } from '@get-better/shared';

const RULES_VERSION = 'v2';

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

  // Get claimed milestones history
  const logs = await db
    .select({ activity: activityLogs.activity, points: activityLogs.points, createdAt: activityLogs.createdAt, logDate: activityLogs.logDate })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.category, 'retention')
      )
    )
    .orderBy(desc(activityLogs.createdAt));

  const milestoneLogs = logs.filter((l) => l.activity.startsWith('milestone_'));
  const claimedMilestones = milestoneLogs.map((l) => ({
    days: parseInt(l.activity.replace('milestone_', '').replace('d', ''), 10) || 0,
    points: l.points,
    claimedAt: l.createdAt.toISOString(),
  }));

  // Sync lastClaimedDays based on valid logs since last slip or currentStreakStart
  const lastSlip = logs.find(l => l.activity === 'slip');
  let validMilestoneLogs = milestoneLogs;
  if (lastSlip) {
    validMilestoneLogs = milestoneLogs.filter(l => l.createdAt > lastSlip.createdAt);
  } else {
    validMilestoneLogs = milestoneLogs.filter(l => l.logDate >= status.currentStreakStart);
  }

  const derivedLastClaimedDays = validMilestoneLogs.length > 0 
    ? Math.max(...validMilestoneLogs.map(l => parseInt(l.activity.replace('milestone_', '').replace('d', ''), 10) || 0))
    : 0;

  if (derivedLastClaimedDays !== status.lastClaimedDays) {
    await db.update(retentionStatus)
      .set({ lastClaimedDays: derivedLastClaimedDays, updatedAt: new Date() })
      .where(eq(retentionStatus.userId, userId));
    status.lastClaimedDays = derivedLastClaimedDays;
  }

  // Active stage days: starts at 7, or lastClaimedDays + 7
  const currentStageDays = (status.lastClaimedDays || 0) + 7;
  const currentStagePoints = (currentStageDays / 7) * 2;

  return {
    currentStageDays,
    currentStagePoints,
    claimedMilestones,
  };
}

export async function claimMilestone(userId: string, db: Database) {
  const status = await getRetentionStatus(userId, db);
  const today = getISTDate();

  const days = status.currentStageDays;
  const points = status.currentStagePoints;
  const activity = `milestone_${days}d`;

  // Insert log entry for the retention milestone
  const [logEntry] = await db.insert(activityLogs).values({
    userId,
    logDate: today,
    category: 'retention',
    activity,
    points,
    rulesVersion: RULES_VERSION,
  }).returning();

  // Advance stage target to next (+7 days)
  await db.update(retentionStatus)
    .set({
      lastClaimedDays: days,
      updatedAt: new Date(),
    })
    .where(eq(retentionStatus.userId, userId));

  const updatedStatus = await getRetentionStatus(userId, db);

  return { logEntry, updatedStatus };
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
  
  // Reset target stage back to 7 days (0 penalty)
  await db.update(retentionStatus)
    .set({
      currentStreakStart: today,
      lastClaimedDays: 0,
      updatedAt: new Date(),
    })
    .where(eq(retentionStatus.userId, userId));
    
  return await getRetentionStatus(userId, db);
}
