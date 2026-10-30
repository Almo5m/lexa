import { toDateKey } from "@/features/gamification/streak";

/** The weekly board starts on Saturday (Cairo time), the first day of the school week in Egypt. */
export function weekStartKey(now: Date): string {
  const today = toDateKey(now);
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const back = (weekday + 1) % 7; // Saturday 0, Sunday 1, ... Friday 6
  const start = new Date(new Date(`${today}T00:00:00Z`).getTime() - back * 86_400_000);
  return start.toISOString().slice(0, 10);
}

/** Whole days until the board starts again (1 to 7), for the line "the board resets in n days". */
export function daysUntilReset(now: Date): number {
  const start = new Date(`${weekStartKey(now)}T00:00:00Z`).getTime();
  const today = new Date(`${toDateKey(now)}T00:00:00Z`).getTime();
  return 7 - Math.round((today - start) / 86_400_000);
}
