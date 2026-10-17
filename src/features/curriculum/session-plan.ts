/** How much a student studies each day. The time he picks sets how many new words and reviews he gets. */
export const DAILY_MINUTES = [15, 30, 45] as const;
export type DailyMinutes = (typeof DAILY_MINUTES)[number];

export function isDailyMinutes(value: unknown): value is DailyMinutes {
  return DAILY_MINUTES.includes(value as DailyMinutes);
}

const FACTOR: Record<DailyMinutes, number> = { 15: 1, 30: 1.8, 45: 2.5 };

/** The admin sets the 15-minute base in the dashboard; longer days scale from it. */
export function newWordsQuota(base: number, minutes: DailyMinutes): number {
  return Math.max(1, Math.round(base * FACTOR[minutes]));
}

/** How many due cards go into one review round. */
export function reviewRoundSize(minutes: DailyMinutes): number {
  return { 15: 15, 30: 25, 45: 35 }[minutes];
}

/** Words are taught in small rounds and tested right away, before the next round. */
export const TEACH_ROUND = 5;
