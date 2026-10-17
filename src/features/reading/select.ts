import { sentenceMentionsWord } from "@/features/srs/judge";
import { entryFor, unitById } from "@/features/curriculum";
import type { Level } from "@/features/curriculum/types";

export const MAX_READING_WORDS = 6;
export const MIN_READING_WORDS = 3;

export interface ReadingCandidate {
  term: string;
  last_reviewed_at: string | null;
}

/** The text is written around the words the student met most recently, so it practices what he just learned. */
export function pickReadingWords(rows: ReadingCandidate[]): string[] {
  return rows
    .filter((row) => row.last_reviewed_at !== null)
    .sort((a, b) => Date.parse(b.last_reviewed_at as string) - Date.parse(a.last_reviewed_at as string))
    .slice(0, MAX_READING_WORDS)
    .map((row) => row.term);
}

const BAND_LEVEL: Record<number, Level> = { 1: "A1", 2: "A2", 3: "B1", 4: "B1", 5: "B1" };

/** The text level follows the hardest path word in the list; words from photos fall back to the student's tested band. */
export function readingLevel(terms: string[], levelBand: number | null): Level {
  const order: Level[] = ["A1", "A2", "B1"];
  let best = -1;
  for (const term of terms) {
    const entry = entryFor(term);
    const level = entry ? unitById(entry.unitId)?.level : undefined;
    if (level) best = Math.max(best, order.indexOf(level));
  }
  if (best >= 0) return order[best];
  return BAND_LEVEL[levelBand ?? 2] ?? "A2";
}

/** How many of the target words the text really uses (any common form counts). */
export function countUsedWords(text: string, terms: string[]): number {
  const plain = text.replace(/\*\*/g, "");
  return terms.filter((term) => sentenceMentionsWord(plain, term)).length;
}

/** A text that ignores the words defeats the purpose, so it is rejected and asked for again. */
export function usesEnoughWords(text: string, terms: string[]): boolean {
  return countUsedWords(text, terms) >= Math.min(4, Math.ceil(terms.length * 0.6));
}
