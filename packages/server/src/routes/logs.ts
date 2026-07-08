import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { activityLogs } from '../db/schema.js';
import { createLogSchema, getISTDate, isToday } from '@get-better/shared';
import { validate } from '../middleware/validate.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { calculatePoints, getDailyCapStatus, CURRENT_RULES_VERSION } from '../services/points.js';
import { backfillMissedDaysForUser } from '../services/backfill.js';

const router = Router();

// All log routes require authentication
router.use(authMiddleware);

// ─── GET / ── Get logs for authenticated user ────────────────────

router.get('/', async (req: AuthRequest, res) => {
  const { date } = req.query;
  const logDate = typeof date === 'string' ? date : undefined;

  // Run backfill first
  await backfillMissedDaysForUser(req.userId!);

  const conditions = [eq(activityLogs.userId, req.userId!)];
  if (logDate) {
    conditions.push(eq(activityLogs.logDate, logDate));
  }

  const logs = await db
    .select()
    .from(activityLogs)
    .where(and(...conditions))
    .orderBy(desc(activityLogs.createdAt));

  const capStatus = await getDailyCapStatus(
    req.userId!,
    logDate || getISTDate(),
    db
  );

  res.json({
    success: true,
    data: {
      logs: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
      })),
      capStatus,
    },
  });
});

// ─── POST / ── Create a new log ──────────────────────────────────

router.post('/', validate(createLogSchema), async (req: AuthRequest, res) => {
  const { category, activity, metadata } = req.body;
  const logDate = getISTDate();

  // Run backfill first to keep compounding calculations consistent
  await backfillMissedDaysForUser(req.userId!);

  // Calculate points (handles caps, compounding, etc.)
  const result = await calculatePoints(req.userId!, category, activity, logDate, db);

  if (result.blocked) {
    const capStatus = await getDailyCapStatus(req.userId!, logDate, db);
    res.status(400).json({
      success: false,
      error: result.reason ?? 'Activity blocked',
      data: { capStatus },
    });
    return;
  }

  // Handle masturbation 5+ reset (special case)
  if (result.reason === 'reset_all_points') {
    // Log the event with 0 points, but signal to frontend
    const [log] = await db
      .insert(activityLogs)
      .values({
        userId: req.userId!,
        logDate,
        category,
        activity,
        points: 0,
        rulesVersion: CURRENT_RULES_VERSION,
        metadata: { ...(metadata ?? {}), resetAllPoints: true },
      })
      .returning();

    const capStatus = await getDailyCapStatus(req.userId!, logDate, db);
    res.status(201).json({
      success: true,
      data: {
        log: {
          ...log,
          createdAt: log.createdAt.toISOString(),
          updatedAt: log.updatedAt.toISOString(),
        },
        capStatus,
        warning: 'All points have been reset to 0 (5+ monthly occurrences)',
      },
    });
    return;
  }

  // Create the log
  const [log] = await db
    .insert(activityLogs)
    .values({
      userId: req.userId!,
      logDate,
      category,
      activity,
      points: result.points,
      rulesVersion: CURRENT_RULES_VERSION,
      metadata: metadata ?? null,
    })
    .returning();

  const capStatus = await getDailyCapStatus(req.userId!, logDate, db);

  res.status(201).json({
    success: true,
    data: {
      log: {
        ...log,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString(),
      },
      capStatus,
      ...(result.reason ? { warning: result.reason } : {}),
    },
  });
});

// ─── PUT /:id ── Edit a log (same-day only) ──────────────────────

router.put('/:id', async (req: AuthRequest, res) => {
  const id = req.params.id as string;

  // Find the log
  const [existingLog] = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, req.userId!)));

  if (!existingLog) {
    res.status(404).json({ success: false, error: 'Log not found' });
    return;
  }

  // Check if editable (same day in IST)
  if (!isToday(existingLog.logDate)) {
    res.status(403).json({
      success: false,
      error: 'Logs can only be edited on the same day (before midnight IST)',
    });
    return;
  }

  const { category, activity, metadata } = req.body;
  const newCategory = category ?? existingLog.category;
  const newActivity = activity ?? existingLog.activity;

  // Recalculate points if activity changed
  let newPoints = existingLog.points;
  let warningMessage: string | undefined = undefined;
  if (category || activity) {
    // Temporarily "remove" the old log from calculations by passing adjusted data
    const result = await calculatePoints(req.userId!, newCategory, newActivity, existingLog.logDate, db);
    if (result.blocked) {
      res.status(400).json({ success: false, error: result.reason ?? 'Activity blocked' });
      return;
    }
    newPoints = result.points;
    warningMessage = result.reason;
  }

  const [updatedLog] = await db
    .update(activityLogs)
    .set({
      category: newCategory,
      activity: newActivity,
      points: newPoints,
      metadata: metadata ?? existingLog.metadata,
      updatedAt: new Date(),
    })
    .where(eq(activityLogs.id, id))
    .returning();

  const capStatus = await getDailyCapStatus(req.userId!, existingLog.logDate, db);

  res.json({
    success: true,
    data: {
      log: {
        ...updatedLog,
        createdAt: updatedLog.createdAt.toISOString(),
        updatedAt: updatedLog.updatedAt.toISOString(),
      },
      capStatus,
      ...(warningMessage ? { warning: warningMessage } : {}),
    },
  });
});

// ─── DELETE /:id ── Delete a log ─────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = req.params.id as string;

  // Find the log
  const [existingLog] = await db
    .select()
    .from(activityLogs)
    .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, req.userId!)));

  if (!existingLog) {
    res.status(404).json({ success: false, error: 'Log not found' });
    return;
  }

  await db.delete(activityLogs).where(eq(activityLogs.id, id));

  const capStatus = await getDailyCapStatus(req.userId!, existingLog.logDate, db);

  res.json({
    success: true,
    data: { deleted: true, capStatus },
  });
});

export default router;
