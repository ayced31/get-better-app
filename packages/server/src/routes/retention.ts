import { Router } from 'express';
import { db } from '../db/index.js';
import { getRetentionStatus, claimMilestone, logSlip } from '../services/retention.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/status', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const status = await getRetentionStatus(userId, db);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/claim', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const result = await claimMilestone(userId, db);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err.message === 'Milestone not reached yet') {
      res.status(400).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

router.post('/slip', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const status = await logSlip(userId, db);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
