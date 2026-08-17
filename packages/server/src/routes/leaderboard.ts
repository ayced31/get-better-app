import { Router } from 'express';
import { db } from '../db/index.js';
import { getCurrentSeason } from '@get-better/shared';
import { authMiddleware } from '../middleware/auth.js';
import { backfillAllUsers } from '../services/backfill.js';
import { getLeaderboardEntries } from '../services/leaderboard.js';

const router = Router();

router.use(authMiddleware);

// ─── GET / ── Leaderboard ────────────────────────────────────────

router.get('/', async (req, res) => {
  // Run backfill (throttled inside backfillAllUsers)
  await backfillAllUsers();

  const period = (req.query.period as string) ?? 'all';
  const entries = await getLeaderboardEntries(period, db);

  res.json({ success: true, data: entries, season: getCurrentSeason() });
});

export default router;
