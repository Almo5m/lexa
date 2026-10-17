import { A1_UNITS } from "./a1";
import { A2_UNITS_A } from "./a2a";
import { A2_UNITS_B } from "./a2b";
import { A2_UNITS_C } from "./a2c";
import { A2_UNITS_D } from "./a2d";
import { A2_UNITS_E } from "./a2e";
import { A2_UNITS_F } from "./a2f";
import { B1_UNITS_A } from "./b1a";
import { B1_UNITS_B } from "./b1b";
import { B1_UNITS_C } from "./b1c";
import { B1_UNITS_D } from "./b1d";
import { B1_UNITS_E } from "./b1e";
import { B1_UNITS_F } from "./b1f";
import type { PathWord, Unit } from "./types";

export type { PathWord, Unit } from "./types";

/** Every unit in teaching order. A2 and B1 are added here when their lists are written. */
export const UNITS: Unit[] = [...A1_UNITS, ...A2_UNITS_A, ...A2_UNITS_B, ...A2_UNITS_C, ...A2_UNITS_D, ...A2_UNITS_E, ...A2_UNITS_F, ...B1_UNITS_A, ...B1_UNITS_B, ...B1_UNITS_C, ...B1_UNITS_D, ...B1_UNITS_E, ...B1_UNITS_F];

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

const UNIT_INDEX = new Map(UNITS.map((unit, index) => [unit.id, index]));

/**
 * Where a student starts, from the band of his level test: 1-2 start at the beginning, 3-4 skip A1, 5 skips A1 and A2.
 * Without a reliable test result everyone starts at the beginning.
 */
export function startUnitIndex(band: number | null | undefined): number {
  const firstOf = (level: "A2" | "B1") => Math.max(0, UNITS.findIndex((unit) => unit.level === level));
  if (typeof band !== "number") return 0;
  if (band >= 5) return firstOf("B1");
  if (band >= 3) return firstOf("A2");
  return 0;
}

/** The next words on the path that the student does not have yet, in teaching order, from his starting unit on. */
export function nextPathWords(owned: ReadonlySet<string>, count: number, fromUnit = 0): PathEntry[] {
  return PATH.filter((entry) => !owned.has(entry.en) && (UNIT_INDEX.get(entry.unitId) ?? 0) >= fromUnit).slice(0, Math.max(0, count));
}

/** How many words are on the path for a student who starts at this unit. */
export function pathSizeFrom(fromUnit: number): number {
  return PATH.filter((entry) => (UNIT_INDEX.get(entry.unitId) ?? 0) >= fromUnit).length;
}

export const PATH_SIZE = PATH.length;

const ORDER = new Map(PATH.map((entry, index) => [entry.en, index]));

/** Position of a word on the path, so words can be put back in teaching order. */
export function pathIndex(term: string): number {
  return ORDER.get(term) ?? Number.MAX_SAFE_INTEGER;
}
