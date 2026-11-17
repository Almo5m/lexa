/** The rules of Booo Plus in one place. Pure functions, so they are easy to test. */

export function isPlus(plusUntil: string | null | undefined, now = new Date()): boolean {
  return Boolean(plusUntil) && new Date(plusUntil as string) > now;
}

/** Whole days left, rounded up, or 0 when Plus is off. */
export function daysLeft(plusUntil: string | null | undefined, now = new Date()): number {
  if (!isPlus(plusUntil, now)) return 0;
  return Math.ceil((new Date(plusUntil as string).getTime() - now.getTime()) / 86_400_000);
}

/** Plus students get more AI calls a day. The free limit is never lowered. */
export function dailyLimitFor(base: number, plus: boolean, multiplier: number): number {
  return plus ? base * Math.max(1, multiplier) : base;
}
