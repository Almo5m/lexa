/** Growth numbers for the admin overview. Pure functions, so they are easy to test. */

export function signupsPerDay(createdAt: string[], dayKeys: string[]): { day: string; count: number }[] {
  const counts = new Map(dayKeys.map((key) => [key, 0]));
  for (const value of createdAt) {
    const key = value.slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return dayKeys.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

export interface ActiveRow {
  user_id: string;
  day: string;
}

export interface ActiveCounts {
  today: number;
  week: number;
  month: number;
}

/** How many different students studied today, in the last 7 days, and in the last 30 days. */
export function activeCounts(rows: ActiveRow[], todayKey: string, weekStartKey: string, monthStartKey: string): ActiveCounts {
  const today = new Set<string>();
  const week = new Set<string>();
  const month = new Set<string>();
  for (const row of rows) {
    if (row.day >= monthStartKey) month.add(row.user_id);
    if (row.day >= weekStartKey) week.add(row.user_id);
    if (row.day === todayKey) today.add(row.user_id);
  }
  return { today: today.size, week: week.size, month: month.size };
}

/** Last day each student studied, from rows that may come in any order. */
export function lastActiveByUser(rows: ActiveRow[]): Map<string, string> {
  const last = new Map<string, string>();
  for (const row of rows) {
    const known = last.get(row.user_id);
    if (!known || row.day > known) last.set(row.user_id, row.day);
  }
  return last;
}

/** Escapes what a search box sends to a database "like" filter, so a student named "50%" does not match everyone. */
export function safeLike(term: string): string {
  return term.replace(/[\\%_,()*]/g, " ").trim().slice(0, 40);
}
