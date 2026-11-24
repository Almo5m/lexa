/**
 * What Bo says in the bubble on the Today screen. It depends on where the student is today (nothing done, midway, finished),
 * his streak, how many words wait for review, and his level, so it never reads like a fixed sentence.
 * Plain function, easy to test; the texts live in the dictionary under `bubble.*`.
 */
export interface BubbleState {
  /** 1 to 5 from the level test, null when he has not taken it. */
  levelBand: number | null;
  streak: number;
  doneCount: number;
  total: number;
  due: number;
  /** Words he has learned so far. */
  learned: number;
}

export type BubbleKey =
  | "bubble.noLevel"
  | "bubble.firstDay"
  | "bubble.allDoneStreak"
  | "bubble.allDone"
  | "bubble.streakRisk"
  | "bubble.dueMany"
  | "bubble.almost"
  | "bubble.midway"
  | "bubble.start1"
  | "bubble.start2"
  | "bubble.start3"
  | "bubble.start4"
  | "bubble.start5";

export const DUE_MANY = 15;
export const STREAK_RISK_FROM = 3;

export function bubbleFor(state: BubbleState): { key: BubbleKey; vars: Record<string, number> } {
  const left = Math.max(state.total - state.doneCount, 0);
  const vars = { streak: state.streak, due: state.due, left, learned: state.learned };

  if (state.levelBand === null) return { key: "bubble.noLevel", vars };
  if (state.doneCount >= state.total) return { key: state.streak >= 2 ? "bubble.allDoneStreak" : "bubble.allDone", vars };
  if (state.doneCount === 0 && state.streak >= STREAK_RISK_FROM) return { key: "bubble.streakRisk", vars };
  if (state.due >= DUE_MANY) return { key: "bubble.dueMany", vars };
  if (state.doneCount > 0) return { key: left === 1 ? "bubble.almost" : "bubble.midway", vars };
  if (state.learned === 0) return { key: "bubble.firstDay", vars };
  const band = Math.min(Math.max(Math.round(state.levelBand), 1), 5);
  return { key: `bubble.start${band}` as BubbleKey, vars };
}
