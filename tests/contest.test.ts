import { describe, expect, it } from "vitest";
import { parseContestQuestions, parseStoredContest, scoreContest } from "@/features/contest/parse";

describe("contest questions", () => {
  it("parses good lines and reports bad ones", () => {
    const { questions, problems } = parseContestQuestions("Capital of Egypt? | Cairo | Giza | Aswan | Luxor | a\n\nbroken | a | b\nQ | x | x | y | z | b\nQ2 | 1 | 2 | 3 | 4 | D");
    expect(questions).toHaveLength(2);
    expect(questions[1].answer).toBe(3);
    expect(problems.map((p) => p.line)).toEqual([3, 4]);
  });
  it("drops malformed stored data", () => {
    expect(parseStoredContest([{ question: "q", options: ["a", "b", "c", "d"], answer: 2 }, { question: "x" }, null])).toHaveLength(1);
    expect(parseStoredContest("nope")).toEqual([]);
  });
  it("scores", () => {
    const qs = parseContestQuestions("a | 1 | 2 | 3 | 4 | a\nb | 1 | 2 | 3 | 4 | c").questions;
    expect(scoreContest(qs, [0, 1])).toBe(1);
    expect(scoreContest(qs, [0, 2])).toBe(2);
    expect(scoreContest(qs, [null])).toBe(0);
  });
});
