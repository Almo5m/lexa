import type { SchoolUnit, SchoolWord } from "./types";

/**
 * The next school words a student does not have yet, unit by unit in the order the admin set.
 * With `unitId` only that unit is used, so a student can study any unit he picks.
 */
export function nextSchoolWords(units: readonly SchoolUnit[], owned: ReadonlySet<string>, count: number, unitId?: string): SchoolWord[] {
  const pool = unitId ? units.filter((unit) => unit.id === unitId) : units;
  const taken = new Set<string>();
  const out: SchoolWord[] = [];
  for (const unit of pool) {
    for (const word of unit.words) {
      if (out.length >= count) return out;
      if (owned.has(word.term) || taken.has(word.term)) continue;
      taken.add(word.term);
      out.push(word);
    }
  }
  return out;
}

export function schoolWordTotal(units: readonly SchoolUnit[]): number {
  return units.reduce((sum, unit) => sum + unit.words.length, 0);
}
