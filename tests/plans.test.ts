import { describe, expect, it } from "vitest";
import { countMembers, memberState, planTable } from "@/features/plus/plans";
import { defaultSettings } from "@/lib/settings";
import { dictionaries } from "@/lib/i18n/dictionary";

describe("plan table", () => {
  it("free is the base, plus only adds", () => {
    const [free, plus] = planTable(defaultSettings);
    expect(free.aiPerDay).toBe(defaultSettings.aiDailyLimitPerStudent);
    expect(plus.aiPerDay).toBe(defaultSettings.aiDailyLimitPerStudent * defaultSettings.plusAiMultiplier);
    expect(plus.chatPerDay).toBeGreaterThanOrEqual(free.chatPerDay);
  });
});

describe("members", () => {
  const now = new Date("2026-11-24T00:00:00Z");
  const days = (n: number) => new Date(now.getTime() + n * 86_400_000).toISOString();
  it("classifies", () => {
    expect(memberState(days(30), now)).toBe("active");
    expect(memberState(days(3), now)).toBe("expiring");
    expect(memberState(days(-1), now)).toBe("expired");
  });
  it("counts", () => {
    expect(countMembers([{ plus_until: days(30) }, { plus_until: days(2) }, { plus_until: days(-5) }, { plus_until: days(60) }], now)).toEqual({ active: 2, expiring: 1, expired: 1 });
  });
  it("texts exist", () => {
    for (const lang of ["ar", "en"] as const) {
      const d = dictionaries[lang] as Record<string, string>;
      for (const k of ["active", "expiring", "expired"]) expect(d[`plans.state.${k}`], `${lang} ${k}`).toBeTruthy();
      for (const k of ["free", "plus"]) expect(d[`plans.name.${k}`], `${lang} ${k}`).toBeTruthy();
    }
  });
});
