import { describe, expect, it } from "vitest";
import { GRAMMAR_UNITS, isCorrectTyped, normalizeAnswer } from "@/features/grammar";

describe("grammar content", () => {
  it("has unique ids and enough exercises", () => {
    expect(new Set(GRAMMAR_UNITS.map((u) => u.id)).size).toBe(GRAMMAR_UNITS.length);
    for (const unit of GRAMMAR_UNITS) {
      expect(unit.exercises.length).toBeGreaterThanOrEqual(12);
      expect(unit.lessonAr.length).toBeGreaterThan(2);
    }
  });

  it("every choose exercise has a valid answer and a gap or question", () => {
    for (const unit of GRAMMAR_UNITS) {
      for (const ex of unit.exercises) {
        expect(ex.why.length).toBeGreaterThan(5);
        if (ex.kind === "choose") {
          expect(ex.options.length).toBeGreaterThanOrEqual(3);
          expect(new Set(ex.options).size).toBe(ex.options.length);
          expect(ex.answer).toBeGreaterThanOrEqual(0);
          expect(ex.answer).toBeLessThan(ex.options.length);
        } else {
          expect(ex.answers.length).toBeGreaterThan(0);
          expect(ex.q).toContain("___");
        }
      }
    }
  });
});

describe("typed answers", () => {
  it("ignores case, spaces, final dot and curly quotes", () => {
    expect(normalizeAnswer("  Hasn’t   Visited. ")).toBe("hasn't visited");
    expect(isCorrectTyped("Has finished.", ["has finished"])).toBe(true);
    expect(isCorrectTyped("", ["has finished"])).toBe(false);
    expect(isCorrectTyped("have finished", ["has finished"])).toBe(false);
  });
});
