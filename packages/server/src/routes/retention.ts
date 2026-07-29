import { Router } from 'express';
import { db } from '../db/index.js';
import { getRetentionStatus, startRetentionStreak, claimMilestone, logSlip, deleteRetentionSlip, updateRetentionSlip } from '../services/retention.js';
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

router.post('/start', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { startDate } = req.body || {};
    const status = await startRetentionStreak(userId, startDate, db);
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
    res.status(500).json({ success: false, error: err.message });
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

router.delete('/slip/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const slipId = req.params.id as string;
    const status = await deleteRetentionSlip(userId, slipId, db);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/slip/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const slipId = req.params.id as string;
    const { logDate } = req.body || {};
    if (!logDate) {
      res.status(400).json({ success: false, error: 'logDate is required' });
      return;
    }
    const status = await updateRetentionSlip(userId, slipId, logDate, db);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
