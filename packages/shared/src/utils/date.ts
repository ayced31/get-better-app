// ─── IST Timezone Utilities ──────────────────────────────────────

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Get current date in IST as 'YYYY-MM-DD'.
 */
export function getISTDate(date: Date = new Date()): string {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  
  // Shift tracking day rollover to 4:00 AM IST.
  // Any activity logged between 12:00 AM and 3:59 AM IST counts as the previous tracking day.
  const hours = istDate.getUTCHours();
  if (hours < 4) {
    istDate.setUTCDate(istDate.getUTCDate() - 1);
  }
  
  return istDate.toISOString().split('T')[0];
}

/**
 * Get current datetime in IST.
 */
export function getISTDateTime(date: Date = new Date()): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Check if a given log date (YYYY-MM-DD) is today in IST.
 */
export function isToday(logDate: string): boolean {
  return logDate === getISTDate();
}

/**
 * Subtract one day from a date string 'YYYY-MM-DD'.
 */
export function subtractDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Add one day to a date string 'YYYY-MM-DD'.
 */
export function addDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split('T')[0];
}

/**
 * Get the first day of the month for a date string.
 */
export function getMonthStart(dateStr: string): string {
  return dateStr.substring(0, 7) + '-01';
}

/**
 * Get the last day of the month for a date string.
 */
export function getMonthEnd(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Get all dates in a range (inclusive).
 */
export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    current = addDay(current);
  }
  return dates;
}
