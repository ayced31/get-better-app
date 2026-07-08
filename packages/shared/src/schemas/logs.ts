import { z } from 'zod';
import { CATEGORY_KEYS } from '../constants/categories.js';

// ─── Activity Log Schemas ────────────────────────────────────────

export const createLogSchema = z.object({
  category: z.string().refine(
    (val) => CATEGORY_KEYS.includes(val),
    { message: 'Invalid category' }
  ),
  activity: z.string().min(1, 'Activity is required'),
  metadata: z.record(z.unknown()).optional(),
});

export const updateLogSchema = z.object({
  category: z.string().refine(
    (val) => CATEGORY_KEYS.includes(val),
    { message: 'Invalid category' }
  ).optional(),
  activity: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type UpdateLogInput = z.infer<typeof updateLogSchema>;
