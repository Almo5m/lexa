import { A1_UNITS } from "./a1";
import { A2_UNITS_A } from "./a2a";
import { A2_UNITS_B } from "./a2b";
import { A2_UNITS_C } from "./a2c";
import { A2_UNITS_D } from "./a2d";
import { A2_UNITS_E } from "./a2e";
import { A2_UNITS_F } from "./a2f";
import { B1_UNITS_A } from "./b1a";
import { B1_UNITS_B } from "./b1b";
import type { PathWord, Unit } from "./types";

export type { PathWord, Unit } from "./types";

/** Every unit in teaching order. A2 and B1 are added here when their lists are written. */
export const UNITS: Unit[] = [...A1_UNITS, ...A2_UNITS_A, ...A2_UNITS_B, ...A2_UNITS_C, ...A2_UNITS_D, ...A2_UNITS_E, ...A2_UNITS_F, ...B1_UNITS_A, ...B1_UNITS_B];

export interface PathEntry extends PathWord {
  unitId: string;
}

export const PATH: PathEntry[] = UNITS.flatMap((unit) => unit.words.map((word) => ({ ...word, unitId: unit.id })));

export function unitById(id: string): Unit | undefined {
  return UNITS.find((unit) => unit.id === id);
}

export function entryFor(term: string): PathEntry | undefined {
  return PATH.find((entry) => entry.en === term);
}

/** The next words on the path that the student does not have yet, in teaching order. */
export function nextPathWords(owned: ReadonlySet<string>, count: number): PathEntry[] {
  return PATH.filter((entry) => !owned.has(entry.en)).slice(0, Math.max(0, count));
}

export const PATH_SIZE = PATH.length;

const ORDER = new Map(PATH.map((entry, index) => [entry.en, index]));

/** Position of a word on the path, so words can be put back in teaching order. */
export function pathIndex(term: string): number {
  return ORDER.get(term) ?? Number.MAX_SAFE_INTEGER;
}
