// Shared date + nutrition aggregation helpers.
// All dates are handled as local calendar keys (YYYY-MM-DD) so a late-night
// meal never lands on the wrong day because of UTC conversion.

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealTotalsRow {
  logged_date: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
}

export const EMPTY_TOTALS: DailyTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
};

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, delta: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

export function lastNDates(count: number, endKey = todayKey()): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    dates.push(addDays(endKey, -i));
  }
  return dates;
}

export function formatShortDay(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatLongDate(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(key: string): string {
  return fromDateKey(key).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function aggregateMealRows<T extends MealTotalsRow>(
  rows: T[]
): Record<string, DailyTotals> {
  const totals: Record<string, DailyTotals> = {};
  for (const row of rows) {
    const key = row.logged_date;
    if (!key) continue;
    const current = totals[key] ?? { ...EMPTY_TOTALS };
    current.calories += Number(row.calories) || 0;
    current.protein += Number(row.protein) || 0;
    current.carbs += Number(row.carbs) || 0;
    current.fats += Number(row.fats) || 0;
    totals[key] = current;
  }
  return totals;
}

/**
 * Consecutive days (ending today, or yesterday if today isn't logged yet)
 * where calories land within 90–110% of the target.
 */
export function calculateStreak(
  dailyCalories: Record<string, number>,
  target: number
): number {
  if (!target || target <= 0) return 0;
  const isTargetMet = (key: string) => {
    const calories = dailyCalories[key] ?? 0;
    return calories >= target * 0.9 && calories <= target * 1.1;
  };

  const today = todayKey();
  const yesterday = addDays(today, -1);
  let cursor = today;
  let streak = 0;

  if (isTargetMet(today)) {
    streak = 1;
    cursor = addDays(today, -1);
  } else if (!isTargetMet(yesterday)) {
    return 0;
  } else {
    cursor = yesterday;
  }

  while (isTargetMet(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function percentOf(value: number, target: number): number {
  if (!target) return 0;
  return Math.round((value / target) * 100);
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
