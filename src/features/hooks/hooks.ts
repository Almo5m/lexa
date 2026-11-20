export const HOOK_MIN = 3;
export const HOOK_MAX = 150;
export const HOOKS_PER_DAY = 10;
export const HOOK_APPROVED_XP = 25;

export type HookCredit = "name" | "nick" | "anon";

/** Trims, collapses spaces and strips anything that looks like markup, so a hook is plain text everywhere it shows. */
export function cleanHook(text: string): string {
  return text.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

export function isValidHook(text: string): boolean {
  return text.length >= HOOK_MIN && text.length <= HOOK_MAX;
}

/** The name printed under a shared hook. "anon" prints nothing. */
export function authorLabel(credit: HookCredit, displayName: string, nickname: string | null): string {
  if (credit === "anon") return "";
  if (credit === "nick" && nickname) return nickname;
  return displayName.trim().split(/\s+/)[0] ?? "";
}

export interface HookInfo {
  /** The student's own hook. */
  mine: string | null;
  /** Where his shared hook stands, if he sent one. */
  status: "pending" | "approved" | "rejected" | null;
  /** An approved hook from another student (or himself) and who wrote it. */
  shared: { hook: string; author: string } | null;
}
