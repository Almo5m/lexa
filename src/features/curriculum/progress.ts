import type { Unit } from "./types";

/** What the app knows about one of the student's words. Nothing here is typed by the browser: it all comes from review state. */
export interface WordState {
  learned: boolean;
  repetitions: number;
}

export type UnitState = "new" | "learning" | "learned" | "mastered";

export interface UnitProgress {
  unitId: string;
  total: number;
  learned: number;
  mastered: number;
  state: UnitState;
}

/** A word counts as solid after two correct reviews in a row, on different days. */
export const SOLID_REPETITIONS = 2;
/** A unit is mastered when this share of its words are solid. */
export const MASTERED_SHARE = 0.8;

export function unitProgress(unit: Unit, states: ReadonlyMap<string, WordState>): UnitProgress {
  let learned = 0;
  let mastered = 0;
  for (const word of unit.words) {
    const state = states.get(word.en);
    if (!state?.learned) continue;
    learned += 1;
    if (state.repetitions >= SOLID_REPETITIONS) mastered += 1;
  }
  const total = unit.words.length;
  const state: UnitState =
    mastered >= Math.ceil(total * MASTERED_SHARE) ? "mastered" : learned === total ? "learned" : learned > 0 ? "learning" : "new";
  return { unitId: unit.id, total, learned, mastered, state };
}

/** The unit the student is working on: the first one that is not fully learned yet. */
export function currentUnit(progress: UnitProgress[]): UnitProgress | null {
  return progress.find((item) => item.state === "new" || item.state === "learning") ?? null;
}
