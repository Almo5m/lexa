import { UNIT_1 } from "./unit1";
import { UNIT_2 } from "./unit2";
import { UNIT_3 } from "./unit3";
import { UNIT_4 } from "./unit4";
import { UNIT_5 } from "./unit5";
import { UNIT_6 } from "./unit6";
import type { GrammarUnit } from "./types";

/** Grammar of the ministry book, Year 3 Term 1. Content is written by us, not copied from the book. */
export const GRAMMAR_UNITS: GrammarUnit[] = [UNIT_1, UNIT_2, UNIT_3, UNIT_4, UNIT_5, UNIT_6];

export function grammarUnit(id: string): GrammarUnit | undefined {
  return GRAMMAR_UNITS.find((unit) => unit.id === id);
}

export * from "./types";
