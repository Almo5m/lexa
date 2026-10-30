/** Daily challenge: five quick "what does this word mean?" questions, the same for every student on the same day. */
export const QUESTION_COUNT = 5;
export const SECONDS_TOTAL = 120;
export const XP_PER_CORRECT = 5;
export const XP_PERFECT_BONUS = 15;

export interface PoolWord {
  term: string;
  /** Arabic meaning, maybe several separated by a comma. */
  meaningAr: string;
}

/** What is stored for the day. The answer stays on the server. */
export interface StoredQuestion {
  term: string;
  options: string[];
  answer: number;
}

export interface PublicQuestion {
  term: string;
  options: string[];
}

/** A small seeded random generator: the same seed always gives the same numbers. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function firstMeaning(meaningAr: string): string {
  return meaningAr.split(/[،,]/)[0]?.trim() ?? "";
}

/**
 * Builds the day's questions from a pool of words. The pool is sorted first, so the order it arrives in never matters.
 * Returns an empty list when the pool is too small to make four different choices.
 */
export function buildQuestions(pool: readonly PoolWord[], seed: string, count = QUESTION_COUNT): StoredQuestion[] {
  const usable = [...new Map(pool.map((word) => [word.term, { term: word.term, meaning: firstMeaning(word.meaningAr) }])).values()]
    .filter((word) => word.meaning !== "")
    .sort((a, b) => a.term.localeCompare(b.term));
  if (new Set(usable.map((word) => word.meaning)).size < 4) return [];

  const random = seededRandom(seed);
  const questions: StoredQuestion[] = [];
  for (const word of shuffle(usable, random)) {
    if (questions.length >= count) break;
    const others = shuffle(
      [...new Set(usable.filter((item) => item.meaning !== word.meaning).map((item) => item.meaning))],
      random,
    ).slice(0, 3);
    const options = shuffle([word.meaning, ...others], random);
    questions.push({ term: word.term, options, answer: options.indexOf(word.meaning) });
  }
  return questions;
}

export function toPublic(questions: readonly StoredQuestion[]): PublicQuestion[] {
  return questions.map(({ term, options }) => ({ term, options }));
}

/** Counts the right answers. A missing, wrong or out-of-range answer is simply wrong. */
export function scoreAnswers(questions: readonly StoredQuestion[], answers: readonly (number | null)[]): number {
  return questions.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0);
}

export function xpForScore(score: number, total: number): number {
  return score * XP_PER_CORRECT + (total > 0 && score === total ? XP_PERFECT_BONUS : 0);
}

/** Reads what the database stored back into questions, dropping anything damaged. */
export function parseStored(value: unknown): StoredQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { term, options, answer } = item as Record<string, unknown>;
    if (typeof term !== "string" || !Array.isArray(options) || !options.every((option) => typeof option === "string")) return [];
    if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 0 || answer >= options.length) return [];
    return [{ term, options: options as string[], answer }];
  });
}
