import { describe, expect, it } from "vitest";
import { earnedCount, nearestBadge, progressOf, type BadgeStats } from "@/features/achievements/badges";

const empty: BadgeStats = { words: 0, streak: 0, xp: 0, read: 0, translate: 0, talk: 0, grammar: 0, writing: 0, listening: 0 };

describe("badges", () => {
  it("earns targets reached and points at the next one", () => {
    const p = progressOf("words", { ...empty, words: 60 });
    expect(p.earned).toEqual([10, 50]);
    expect(p.next).toBe(100);
    expect(progressOf("words", { ...empty, words: 5000 }).next).toBeNull();
  });

  it("derives the XP level for the level badges", () => {
    expect(progressOf("level", { ...empty, xp: 0 }).value).toBe(1);
    expect(progressOf("level", { ...empty, xp: 100 }).earned).toEqual([]);
    expect(progressOf("level", { ...empty, xp: 600 }).value).toBeGreaterThanOrEqual(3);
  });

  it("counts earned badges out of the total", () => {
    expect(earnedCount(empty).earned).toBe(0);
    expect(earnedCount({ ...empty, words: 10, streak: 3 }).earned).toBe(2);
  });

  it("only suggests a badge that is at least halfway", () => {
    expect(nearestBadge(empty)).toBeNull();
    expect(nearestBadge({ ...empty, words: 40 })).toEqual({ metric: "words", target: 50, left: 10 });
    expect(nearestBadge({ ...empty, words: 12 })).toBeNull();
  });
});
