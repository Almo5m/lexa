import { describe, expect, it } from "vitest";
import { passageSchema } from "@/features/reading/schemas";
import { countUsedWords, pickReadingWords, readingLevel, usesEnoughWords } from "@/features/reading/select";
import { gradeChoice, toView } from "@/features/reading/view";

const passage = passageSchema.parse({
  title: "My morning",
  text: "My **mother** wakes up early. She makes tea and bread for my **father**. Then my **brother** and I go to school by bus. We are happy because the weather is nice today and our teacher is kind.",
  textAr: "أمي بتصحى بدري وبتعمل شاي وعيش لأبويا وبعدين أنا وأخويا بنروح المدرسة بالأتوبيس.",
  questions: [
    { question: "What does the mother make?", options: ["Tea and bread", "Juice", "Soup"], answerIndex: 0, explanationAr: "هي بتعمل **tea and bread**." },
    { question: "They go to school by car.", options: ["True", "False"], answerIndex: 1, explanationAr: "بيروحوا بـ **bus**." },
    { question: "What does brother mean here?", options: ["أخ", "عم", "جار"], answerIndex: 0, explanationAr: "**brother** يعني أخ." },
  ],
});

describe("reading words", () => {
  it("picks the most recently learned words first and ignores unlearned ones", () => {
    const rows = [
      { term: "old", last_reviewed_at: "2026-10-01T10:00:00Z" },
      { term: "new", last_reviewed_at: "2026-10-14T10:00:00Z" },
      { term: "never", last_reviewed_at: null },
    ];
    expect(pickReadingWords(rows)).toEqual(["new", "old"]);
  });

  it("takes at most six", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ term: `w${i}`, last_reviewed_at: `2026-10-${10 + i}T10:00:00Z` }));
    expect(pickReadingWords(rows)).toHaveLength(6);
  });

  it("uses the level of the hardest path word, else the tested band", () => {
    expect(readingLevel(["mother", "father"], 4)).toBe("A1");
    expect(readingLevel(["gigantic"], 1)).toBe("A1");
    expect(readingLevel(["gigantic"], 3)).toBe("B1");
    expect(readingLevel(["gigantic"], null)).toBe("A2");
  });
});

describe("passage check", () => {
  it("counts words in any common form and ignores the bold marks", () => {
    expect(countUsedWords(passage.text, ["mother", "father", "brother", "sister"])).toBe(3);
    expect(countUsedWords("My brothers play football", ["brother"])).toBe(1);
  });
  it("rejects a text that ignores the words", () => {
    expect(usesEnoughWords(passage.text, ["sister", "uncle", "aunt", "cousin", "daughter"])).toBe(false);
    expect(usesEnoughWords(passage.text, ["mother", "father", "brother"])).toBe(true);
  });
  it("rejects a passage whose answer index is out of range", () => {
    const bad = { ...passage, questions: passage.questions.map((q, i) => (i === 1 ? { ...q, answerIndex: 2 } : q)) };
    expect(passageSchema.safeParse(bad).success).toBe(false);
  });
});

describe("answers", () => {
  it("hides right answers until a question is answered", () => {
    const fresh = toView(passage, ["mother"], []);
    expect(JSON.stringify(fresh)).not.toContain("explanationAr");
    expect(fresh.answered).toEqual([]);
    expect(fresh.textAr).toBeNull();
  });
  it("grades on the server and opens the translation at the end", () => {
    const answers = [gradeChoice(passage, 0, 0), gradeChoice(passage, 1, 0), gradeChoice(passage, 2, 0)];
    const view = toView(passage, ["mother"], answers);
    expect(view.score).toBe(2);
    expect(view.completed).toBe(true);
    expect(view.textAr).not.toBeNull();
    expect(view.answered[1]).toMatchObject({ correct: false, correctIndex: 1 });
  });
  it("refuses a choice outside the options", () => {
    expect(() => gradeChoice(passage, 1, 2)).toThrow();
  });
});
