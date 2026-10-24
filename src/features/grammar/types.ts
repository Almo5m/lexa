/** One grammar exercise. Answers are checked by code, so no AI call is needed and the result is always the same. */
export type Exercise =
  | { kind: "choose"; q: string; options: string[]; answer: number; why: string }
  | { kind: "type"; q: string; answers: string[]; why: string };

export interface GrammarUnit {
  id: string;
  /** Unit number in the ministry book (Year 3, Term 1). */
  number: number;
  topic: string;
  rule: string;
  /** Short explanation in Egyptian Arabic, one line per item. */
  lessonAr: string[];
  /** Examples in English, each with its Arabic meaning. */
  examples: [string, string][];
  exercises: Exercise[];
}

/** Makes typed answers comparable: case, spaces, final dot and curly quotes do not matter. */
export function normalizeAnswer(value: string): string {
  return value
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!]+$/, "")
    .trim();
}

export function isCorrectTyped(value: string, answers: string[]): boolean {
  const given = normalizeAnswer(value);
  return given !== "" && answers.some((answer) => normalizeAnswer(answer) === given);
}
