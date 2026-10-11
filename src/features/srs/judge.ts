import type { Grade } from "./types";
import { normalizeWord } from "@/features/words/clean";

/** Typed word: right or wrong is decided here, never by the student. */
export function judgeTypedWord(answer: string, term: string, hintUsed: boolean): Grade {
  if (normalizeWord(answer) !== term) return "again";
  return hintUsed ? "hard" : "good";
}

/** Cheap check before spending an AI call: does the sentence contain the word (or a form starting like it)? */
export function sentenceMentionsWord(sentence: string, term: string): boolean {
  const stem = term.length > 4 ? term.slice(0, Math.max(4, term.length - 2)) : term;
  return sentence
    .toLowerCase()
    .split(/[^a-z']+/)
    .some((token) => token.startsWith(stem));
}

export function sentenceGrade(score: number, usedWord: boolean, targetWordCorrect: boolean, hintUsed: boolean): Grade {
  if (!usedWord || !targetWordCorrect) return "again";
  if (score >= 0.85 && !hintUsed) return "good";
  if (score >= 0.6) return "hard";
  return "again";
}
