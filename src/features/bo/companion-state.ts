import type { Fractions } from "@/features/bo/placement";

/** What the student chose about the floating Bo. Kept in the browser, per device. */
export type CompanionMode = "dock" | "free";

export interface CompanionPrefs {
  mode: CompanionMode;
  free: Fractions;
  hidden: boolean;
}

export const DEFAULT_PREFS: CompanionPrefs = { mode: "dock", free: { fx: 0.85, fy: 0.7 }, hidden: false };

const KEY = "bo-companion-v1";

const unit = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : fallback;

/** Anything stored that is not understood is ignored, so a broken value can never break the page. */
export function parsePrefs(raw: string | null): CompanionPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const data = JSON.parse(raw) as Partial<CompanionPrefs> & { free?: Partial<Fractions> };
    return {
      mode: data.mode === "free" ? "free" : "dock",
      free: { fx: unit(data.free?.fx, DEFAULT_PREFS.free.fx), fy: unit(data.free?.fy, DEFAULT_PREFS.free.fy) },
      hidden: data.hidden === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function readPrefs(): CompanionPrefs {
  try {
    return parsePrefs(window.localStorage.getItem(KEY));
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePrefs(prefs: CompanionPrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Blocked storage: the choice lasts until the page closes.
  }
}

/** The first-visit guide is remembered per account, so a second student on the same device still gets it. */
export function guideKey(userId: string): string {
  return `bo-guide-v1:${userId}`;
}
