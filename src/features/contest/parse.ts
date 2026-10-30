export interface ContestQuestion {
  question: string;
  options: [string, string, string, string];
  answer: number;
}

export interface ParsedContest {
  questions: ContestQuestion[];
  problems: { line: number }[];
}

export const MAX_CONTEST_QUESTIONS = 30;
const LETTERS = ["a", "b", "c", "d"];

/**
 * One question per line: question | A | B | C | D | correct letter (a, b, c or d).
 * A bad line is reported by its number and skipped, so one typo does not lose the rest.
 */
export function parseContestQuestions(text: string): ParsedContest {
  const questions: ContestQuestion[] = [];
  const problems: { line: number }[] = [];
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const parts = line.split("|").map((part) => part.trim());
    const letter = parts[5]?.toLowerCase();
    const answer = LETTERS.indexOf(letter ?? "");
    const valid = parts.length === 6 && parts.slice(0, 5).every((part) => part.length > 0 && part.length <= 200) && answer >= 0 && new Set(parts.slice(1, 5)).size === 4;
    if (!valid || questions.length >= MAX_CONTEST_QUESTIONS) return void problems.push({ line: index + 1 });
    questions.push({ question: parts[0], options: [parts[1], parts[2], parts[3], parts[4]], answer });
  });
  return { questions, problems };
}

/** Reads what the database stored; anything malformed is dropped. */
export function parseStoredContest(value: unknown): ContestQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const q = item as Partial<ContestQuestion> | null;
    if (!q || typeof q.question !== "string" || !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every((o) => typeof o === "string") || !Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) > 3) return [];
    return [{ question: q.question, options: q.options as ContestQuestion["options"], answer: q.answer as number }];
  });
}

export function scoreContest(questions: ContestQuestion[], answers: (number | null)[]): number {
  return questions.reduce((sum, question, i) => sum + (answers[i] === question.answer ? 1 : 0), 0);
}
