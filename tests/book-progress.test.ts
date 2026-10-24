import { describe, expect, it } from "vitest";
import { bookMeter, clampScore, keepBest } from "@/features/book/progress";

describe("book progress", () => {
  it("clamps scores to the real maximum", () => {
    expect(clampScore(99, 13)).toBe(13);
    expect(clampScore(-4, 13)).toBe(0);
    expect(clampScore(Number.NaN, 13)).toBe(0);
    expect(clampScore(7.6, 13)).toBe(8);
  });

  it("keeps only the best result", () => {
    expect(keepBest(null, 5)).toBe(5);
    expect(keepBest(9, 5)).toBe(9);
    expect(keepBest(5, 9)).toBe(9);
  });

  it("has no number before anything is tried, then a weighted share", () => {
    expect(bookMeter([], 9).percent).toBeNull();
    const meter = bookMeter([{ item_id: "g1", score: 13, max_score: 13 }, { item_id: "w-essay", score: 10, max_score: 20 }], 9);
    expect(meter.percent).toBe(70);
    expect(meter.value).toBe("2 / 9");
  });
});
