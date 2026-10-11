import { describe, expect, it } from "vitest";
import { bandLabel, looksEnglish, recentAverage, topMistakeTypes, type StoredSession } from "@/features/talk/analyze";
import { talkAnalysisSchema } from "@/features/talk/schemas";
import { topicsFor } from "@/features/talk/topics";

const session = (v: number, g: number, c: number, types: string[]): StoredSession => ({
  vocabulary_level: v,
  grammar_level: g,
  clarity_level: c,
  created_at: "2026-10-10T10:00:00Z",
  mistakes: types.map((type) => ({ original: "x", fixed: "y", type: type as never, explanationAr: "z" })),
});

describe("talk analysis helpers", () => {
  it("accepts English and refuses Arabic or too little text", () => {
    expect(looksEnglish("I go to school every day with my friend.")).toBe(true);
    expect(looksEnglish("انا بروح المدرسة كل يوم مع صاحبي")).toBe(false);
    expect(looksEnglish("hi")).toBe(false);
  });
  it("maps levels to bands", () => {
    expect([1, 2, 3, 4, 5].map(bandLabel)).toEqual(["A1", "A2", "B1", "B2", "C1"]);
    expect(bandLabel(9)).toBe("C1");
  });
  it("finds the repeated patterns, ignoring 'other'", () => {
    const top = topMistakeTypes([
      session(2, 2, 2, ["missing_be", "article", "other"]),
      session(2, 2, 2, ["missing_be", "other", "other"]),
      session(2, 2, 2, ["article"]),
      session(2, 2, 2, ["missing_be"]),
    ]);
    expect(top[0]).toEqual({ type: "missing_be", count: 3 });
    expect(top.map((item) => item.type)).not.toContain("other");
  });
  it("averages only the latest sessions", () => {
    const avg = recentAverage([session(3, 3, 3, []), session(1, 1, 1, []), session(2, 2, 2, []), session(5, 5, 5, [])], 3);
    expect(avg?.vocabulary).toBe(2);
    expect(recentAverage([])).toBeNull();
  });
  it("turns an unknown mistake label into 'other' instead of failing", () => {
    const parsed = talkAnalysisSchema.parse({
      vocabularyLevel: 2,
      grammarLevel: 2,
      clarityLevel: 3,
      mistakes: [{ original: "a", fixed: "b", type: "made_up", explanationAr: "c" }],
      naturalVersion: "n",
      feedbackAr: "f",
    });
    expect(parsed.mistakes[0].type).toBe("other");
  });
  it("puts topics that match interests first", () => {
    expect(topicsFor(["gaming"])[0].id).toBe("gaming");
    expect(topicsFor([])[0].interest).toBeNull();
  });
});
