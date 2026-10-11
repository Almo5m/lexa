import { describe, expect, it } from "vitest";
import { judgeTypedWord, sentenceGrade, sentenceMentionsWord } from "@/features/srs/judge";

describe("judging typed answers", () => {
  it("the system decides: exact word is good, with hint is hard, wrong is again", () => {
    expect(judgeTypedWord(" Ability ", "ability", false)).toBe("good");
    expect(judgeTypedWord("ability", "ability", true)).toBe("hard");
    expect(judgeTypedWord("abilty", "ability", false)).toBe("again");
  });
  it("detects the word or its forms in a sentence before calling the AI", () => {
    expect(sentenceMentionsWord("My ability is thinking.", "ability")).toBe(true);
    expect(sentenceMentionsWord("He walked home", "walk")).toBe(true);
    expect(sentenceMentionsWord("I like football", "ability")).toBe(false);
  });
  it("maps the AI verdict to a grade", () => {
    expect(sentenceGrade(0.9, true, true, false)).toBe("good");
    expect(sentenceGrade(0.7, true, true, false)).toBe("hard");
    expect(sentenceGrade(0.9, true, false, false)).toBe("again");
    expect(sentenceGrade(0.9, false, true, false)).toBe("again");
  });
});
