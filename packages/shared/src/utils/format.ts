// ─── Points Formatting Utilities ─────────────────────────────────

/**
 * Display a number as integer when whole, with 1 decimal otherwise.
 * e.g. 3 → "3", 1.5 → "1.5", 3.0 → "3"
 */
export function formatPoints(points: number): string {
  if (Number.isInteger(points)) return String(points);
  return points.toFixed(1);
}

/**
 * Format with +/- prefix.
 * e.g. 3 → "+3", -1.5 → "-1.5", 0 → "0"
 */
export function formatPointsSigned(points: number): string {
  if (points === 0) return '0';
  const formatted = formatPoints(Math.abs(points));
  return points > 0 ? `+${formatted}` : `-${formatted}`;
}
