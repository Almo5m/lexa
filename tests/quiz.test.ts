import { describe, expect, it } from "vitest";
import { blankSentence, buildQuiz, MIN_WORDS_FOR_QUIZ, type QuizWord } from "@/features/quiz/build";

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const words: QuizWord[] = [
  { id: "1", term: "borrow", meaningAr: "يستعير", situationAr: "تاخد قلم من صاحبك وترجعه", sentence: "I borrowed a pen from my friend." },
  { id: "2", term: "lend", meaningAr: "يُعير", situationAr: "تدي قلمك لصاحبك مؤقتًا", sentence: "Can you lend me your charger?" },
  { id: "3", term: "crowded", meaningAr: "مزدحم", situationAr: "الأتوبيس مليان ناس", sentence: "The bus was too crowded to sit." },
  { id: "4", term: "tidy", meaningAr: "مرتب", situationAr: "أوضتك نضيفة ومترتبة", sentence: "My brother never keeps his room tidy." },
  { id: "5", term: "cheap", meaningAr: "رخيص", situationAr: "سعره قليل", sentence: "This sandwich is cheap and tasty." },
  { id: "6", term: "carry", meaningAr: "يحمل", situationAr: "شايل شنطة تقيلة", sentence: "She carried three bags upstairs." },
];

describe("blankSentence", () => {
  it("blanks the word and its common endings", () => {
    expect(blankSentence("I borrowed a pen.", "borrow")).toBe("I _____ a pen.");
    expect(blankSentence("She carried three bags.", "carry")).toBe("She _____ three bags.");
    expect(blankSentence("He wants to lend it.", "lend")).toBe("He wants to _____ it.");
  });
  it("returns null when the word does not appear, such as irregular forms", () => {
    expect(blankSentence("She lent me a pen.", "lend")).toBeNull();
  });
  it("does not blank inside other words", () => {
    expect(blankSentence("The scheap shop.", "cheap")).toBeNull();
  });
});

describe("buildQuiz", () => {
  it("needs enough words to make wrong answers", () => {
    expect(buildQuiz(words.slice(0, MIN_WORDS_FOR_QUIZ - 1), 5)).toEqual([]);
  });

  it("gives four unique options and always includes the right one", () => {
    const quiz = buildQuiz(words, 6, seeded(2));
    expect(quiz.length).toBe(6);
    for (const question of quiz) {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options.map((o) => o.label)).size).toBe(4);
      expect(question.options.some((o) => o.id === question.wordId)).toBe(true);
    }
  });

  it("targets each requested word once, in the order given", () => {
    const quiz = buildQuiz(words, 4, seeded(4));
    expect(quiz.map((q) => q.wordId)).toEqual(["1", "2", "3", "4"]);
  });

  it("mixes question types instead of repeating one", () => {
    const quiz = buildQuiz(words, 6, seeded(8));
    expect(new Set(quiz.map((q) => q.type)).size).toBeGreaterThanOrEqual(4);
  });

  it("answers with meanings for meaning and listening questions, words otherwise", () => {
    const quiz = buildQuiz(words, 6, seeded(11));
    for (const question of quiz) {
      const correct = question.options.find((o) => o.id === question.wordId)!;
      const word = words.find((w) => w.id === question.wordId)!;
      const expectMeaning = question.type === "meaning" || question.type === "listen";
      expect(correct.label).toBe(expectMeaning ? word.meaningAr : word.term);
    }
  });

  it("gap questions never leak the target word in the prompt", () => {
    const quiz = buildQuiz(words, 6, seeded(13)).filter((q) => q.type === "gap");
    for (const question of quiz) {
      const word = words.find((w) => w.id === question.wordId)!;
      expect(question.prompt).toContain("_____");
      expect(question.prompt.toLowerCase()).not.toContain(word.term.slice(0, 4));
    }
  });

  it("falls back to another type when a sentence cannot be blanked", () => {
    const hard = words.map((w) => (w.id === "2" ? { ...w, sentence: "She lent me a pen." } : w));
    const quiz = buildQuiz(hard, 6, seeded(2));
    expect(quiz.find((q) => q.wordId === "2")).toBeDefined();
    expect(quiz.find((q) => q.wordId === "2")!.type).not.toBe("gap");
  });
});
