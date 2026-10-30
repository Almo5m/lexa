import { describe, expect, it } from "vitest";
import { buildQuestions, parseStored, scoreAnswers, seededRandom, xpForScore, type PoolWord } from "@/features/challenge/questions";

const pool: PoolWord[] = ["mother:أم", "father:أب", "brother:أخ", "sister:أخت", "uncle:عم، خال", "son:ابن", "nurse:ممرضة"].map((item) => {
  const [term, meaningAr] = item.split(":");
  return { term, meaningAr };
});

describe("buildQuestions", () => {
  it("gives the same questions for the same seed, whatever the pool order", () => {
    const a = buildQuestions(pool, "2026-10-29");
    const b = buildQuestions([...pool].reverse(), "2026-10-29");
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
  });

  it("changes with the day and always has the right answer among four different options", () => {
    const today = buildQuestions(pool, "2026-10-29");
    expect(buildQuestions(pool, "2026-10-30")).not.toEqual(today);
    for (const question of today) {
      expect(new Set(question.options).size).toBe(4);
      const word = pool.find((item) => item.term === question.term)!;
      expect(question.options[question.answer]).toBe(word.meaningAr.split("،")[0].trim());
    }
  });

  it("makes no challenge from a pool that is too small", () => {
    expect(buildQuestions(pool.slice(0, 3), "d")).toEqual([]);
  });
});

describe("scoring", () => {
  const questions = buildQuestions(pool, "x");
  it("counts right answers and ignores empty or invalid ones", () => {
    const answers = questions.map((q) => q.answer);
    expect(scoreAnswers(questions, answers)).toBe(5);
    expect(scoreAnswers(questions, [answers[0], null, 99, -1, answers[4]])).toBe(2);
    expect(scoreAnswers(questions, [])).toBe(0);
  });
  it("adds the bonus only for a perfect score", () => {
    expect(xpForScore(5, 5)).toBe(40);
    expect(xpForScore(4, 5)).toBe(20);
    expect(xpForScore(0, 0)).toBe(0);
  });
});

describe("helpers", () => {
  it("seededRandom is repeatable", () => {
    expect(seededRandom("a")()).toBe(seededRandom("a")());
    expect(seededRandom("a")()).not.toBe(seededRandom("b")());
  });
  it("parseStored drops damaged items", () => {
    expect(parseStored([{ term: "a", options: ["x", "y"], answer: 1 }, { term: "b", options: ["x"], answer: 3 }, 5, null])).toEqual([{ term: "a", options: ["x", "y"], answer: 1 }]);
    expect(parseStored("nope")).toEqual([]);
  });
});
