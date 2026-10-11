import type { AppSettings } from "@/lib/settings";

export type DemoRefusal = "demo_closed" | "demo_limit_visitor" | "demo_limit_total";

export class DemoRefusedError extends Error {
  constructor(public reason: DemoRefusal) {
    super(reason);
  }
}

/** Pure decision, so the rules can be tested without a database. */
export function evaluateDemoHit(
  hit: { visitorHits: number; totalHits: number },
  settings: Pick<AppSettings, "demoEnabled" | "demoDailyLimitPerVisitor" | "demoDailyLimitTotal">,
): DemoRefusal | null {
  if (!settings.demoEnabled) return "demo_closed";
  if (hit.totalHits > settings.demoDailyLimitTotal) return "demo_limit_total";
  if (hit.visitorHits > settings.demoDailyLimitPerVisitor) return "demo_limit_visitor";
  return null;
}

export const DEMO_WORD = /^[A-Za-z][A-Za-z'-]{1,28}$/;

/** A request from another website must not be able to spend our AI budget. */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
