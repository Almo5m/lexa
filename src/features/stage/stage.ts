/** The school stage a student studies in. "general" is an adult or anyone learning English with no school book. */
export const STAGES = ["sec1", "sec2", "sec3", "general"] as const;
export type Stage = (typeof STAGES)[number];

/** Where a unit of school words belongs: one stage, or every stage. */
export const UNIT_STAGES = ["all", ...STAGES] as const;
export type UnitStage = (typeof UNIT_STAGES)[number];

export function isStage(value: unknown): value is Stage {
  return typeof value === "string" && (STAGES as readonly string[]).includes(value);
}

export function isUnitStage(value: unknown): value is UnitStage {
  return typeof value === "string" && (UNIT_STAGES as readonly string[]).includes(value);
}

/** The stage he chose, or null for accounts that never chose (the old default was "secondary"). */
export function chosenStage(raw: unknown): Stage | null {
  return isStage(raw) ? raw : null;
}

/** The ministry book we have inside (grammar, writing, listening, speaking) is the third-secondary book. Accounts that never chose keep it. */
export function hasBook(raw: unknown): boolean {
  const stage = chosenStage(raw);
  return stage === null || stage === "sec3";
}

/** Whether a school unit is for this student. Someone who never chose sees every unit. */
export function unitFits(unitStage: string | null | undefined, raw: unknown): boolean {
  const stage = chosenStage(raw);
  if (stage === null) return true;
  return !unitStage || unitStage === "all" || unitStage === stage;
}
