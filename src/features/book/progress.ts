import type { Meter } from "@/features/skills/meters";

export interface BookScoreRow {
  item_id: string;
  score: number;
  max_score: number;
}

/** A score is a whole number between 0 and the real maximum of that item, whatever the client says. */
export function clampScore(score: number, max: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(max, Math.max(0, Math.round(score)));
}

/** Only a better result replaces the saved one. */
export function keepBest(previous: number | null, next: number): number {
  return previous === null ? next : Math.max(previous, next);
}

/** Best results of the units and tasks tried so far, as one share of what they were worth. */
export function bookMeter(rows: readonly BookScoreRow[], totalItems: number): Meter {
  if (rows.length === 0) return { percent: null, value: "—" };
  const earned = rows.reduce((sum, row) => sum + row.score, 0);
  const worth = rows.reduce((sum, row) => sum + row.max_score, 0);
  return { percent: Math.round((earned / worth) * 100), value: `${rows.length} / ${totalItems}` };
}
