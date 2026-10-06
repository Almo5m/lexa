import { describe, expect, it } from "vitest";
import { comboBonus, levelFromXp, levelProgress, xpForLevel } from "@/features/gamification/xp";
import { daysBetween, recordActivity, toDateKey } from "@/features/gamification/streak";

describe("levels", () => {
  it("starts at level 1 with zero XP", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });
  it("crosses thresholds exactly", () => {
    expect(xpForLevel(2)).toBe(100);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(299)).toBe(2);
    expect(levelFromXp(300)).toBe(3);
  });
  it("reports progress inside a level", () => {
    const progress = levelProgress(150);
    expect(progress.level).toBe(2);
    expect(progress.currentXp).toBe(50);
    expect(progress.neededXp).toBe(200);
    expect(progress.ratio).toBeCloseTo(0.25);
  });
});

describe("combo bonus", () => {
  it("starts at three correct answers and is capped", () => {
    expect(comboBonus(2)).toBe(0);
    expect(comboBonus(3)).toBe(2);
    expect(comboBonus(6)).toBe(4);
    expect(comboBonus(100)).toBe(10);
  });
});

describe("streak", () => {
  const base = { current: 0, longest: 0, lastActiveDate: null as string | null, freezes: 1 };

  it("starts a streak on first activity", () => {
    expect(recordActivity(base, "2026-10-06")).toMatchObject({ current: 1, longest: 1 });
  });
  it("is idempotent within the same day", () => {
    const first = recordActivity(base, "2026-10-06");
    expect(recordActivity(first, "2026-10-06")).toBe(first);
  });
  it("continues on the next day", () => {
    const day1 = recordActivity(base, "2026-10-06");
    expect(recordActivity(day1, "2026-10-07").current).toBe(2);
  });
  it("spends a freeze to survive one missed day", () => {
    const day1 = { ...recordActivity(base, "2026-10-06"), current: 5, longest: 5 };
    const result = recordActivity(day1, "2026-10-08");
    expect(result.current).toBe(6);
    expect(result.freezes).toBe(0);
  });
  it("resets when there is no freeze left", () => {
    const state = { current: 5, longest: 5, lastActiveDate: "2026-10-06", freezes: 0 };
    const result = recordActivity(state, "2026-10-08");
    expect(result.current).toBe(1);
    expect(result.longest).toBe(5);
  });
  it("a long absence resets even with a freeze", () => {
    const state = { current: 5, longest: 9, lastActiveDate: "2026-10-01", freezes: 1 };
    expect(recordActivity(state, "2026-10-08")).toMatchObject({ current: 1, longest: 9, freezes: 1 });
  });
});

describe("date helpers", () => {
  it("computes day gaps across month boundaries", () => {
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
  });
  it("uses the Cairo calendar day, not UTC", () => {
    expect(toDateKey(new Date("2026-10-06T22:30:00Z"))).toBe("2026-10-07");
  });
});
