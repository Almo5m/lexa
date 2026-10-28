import type { WordStatus } from "@/features/srs/types";
import type { SchoolUnit } from "./types";

export type SchoolWordState = WordStatus | "todo";

/** How far a student is in one unit: every word is either not started or in one of the four study states. */
export interface UnitProgress {
  total: number;
  /** Words he has studied at least once. */
  started: number;
  counts: Record<SchoolWordState, number>;
}

export function unitProgress(unit: SchoolUnit, stateOf: (term: string) => SchoolWordState): UnitProgress {
  const counts: Record<SchoolWordState, number> = { todo: 0, new: 0, learning: 0, weak: 0, mastered: 0 };
  for (const word of unit.words) counts[stateOf(word.term)]++;
  return { total: unit.words.length, started: unit.words.length - counts.todo, counts };
}

/** Share of the unit he has studied, 0 to 100. */
export function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}
