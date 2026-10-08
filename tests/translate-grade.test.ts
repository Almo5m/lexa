import { describe, expect, it } from "vitest";
import { scoreToGrade, verdictOf } from "@/features/translate/grade";

describe("scoreToGrade", () => {
  it("a strong score with the target word right is good", () => {
    expect(scoreToGrade(0.9, true)).toBe("good");
  });
  it("an understandable score is only hard", () => {
    expect(scoreToGrade(0.7, true)).toBe("hard");
  });
  it("a weak score is again", () => {
    expect(scoreToGrade(0.3, true)).toBe("again");
  });
  it("misusing the target word is again even when the sentence is otherwise fine", () => {
    expect(scoreToGrade(0.95, false)).toBe("again");
    expect(scoreToGrade(0.7, false)).toBe("again");
  });
  it("sits exactly on the thresholds", () => {
    expect(scoreToGrade(0.85, true)).toBe("good");
    expect(scoreToGrade(0.6, true)).toBe("hard");
    expect(scoreToGrade(0.59, true)).toBe("again");
  });
});

describe("verdictOf", () => {
  it("maps the score to what the student sees", () => {
    expect(verdictOf(0.9)).toBe("correct");
    expect(verdictOf(0.7)).toBe("almost");
    expect(verdictOf(0.2)).toBe("wrong");
  });
});
