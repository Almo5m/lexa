/**
 * Words page logic: how well the student knows each word (five levels, one color each),
 * and the filters / sorting on top of them. Pure functions, no database.
 */
import type { WordStatus } from "@/features/srs/types";

export const LEVELS = ["todo", "learning", "weak", "known", "mastered"] as const;
export type MasteryLevel = (typeof LEVELS)[number];

export const SOURCES = ["school", "path", "own"] as const;
export type WordSource = (typeof SOURCES)[number];

export const SORTS = ["az", "newest", "weakest"] as const;
export type WordSort = (typeof SORTS)[number];

export interface BubbleWord {
  id: string;
  term: string;
  status: WordStatus;
  reviewed: boolean;
  correct: number;
  wrong: number;
  source: WordSource;
  groupId: string | null;
  createdAt: string;
}

/** A word that was never studied is "todo", whatever the scheduler says; "known" is learning with a good record. */
export function levelOf(word: Pick<BubbleWord, "status" | "reviewed" | "correct" | "wrong">): MasteryLevel {
  if (!word.reviewed) return "todo";
  if (word.status === "mastered") return "mastered";
  if (word.status === "weak") return "weak";
  return word.correct >= 3 && word.correct > word.wrong * 2 ? "known" : "learning";
}

export function isLevel(value: unknown): value is MasteryLevel {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}
export function isSource(value: unknown): value is WordSource {
  return typeof value === "string" && (SOURCES as readonly string[]).includes(value);
}
export function isSort(value: unknown): value is WordSort {
  return typeof value === "string" && (SORTS as readonly string[]).includes(value);
}

export interface WordFilter {
  level?: MasteryLevel;
  source?: WordSource;
  groupId?: string;
  query?: string;
  sort?: WordSort;
}

export function filterWords(words: BubbleWord[], filter: WordFilter): BubbleWord[] {
  const query = (filter.query ?? "").trim().toLowerCase();
  const kept = words.filter(
    (word) =>
      (!filter.level || levelOf(word) === filter.level) &&
      (!filter.source || word.source === filter.source) &&
      (!filter.groupId || word.groupId === filter.groupId) &&
      (!query || word.term.toLowerCase().includes(query)),
  );
  const sort = filter.sort ?? "az";
  return [...kept].sort((a, b) => {
    if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "weakest") return weakness(b) - weakness(a) || a.term.localeCompare(b.term);
    return a.term.localeCompare(b.term);
  });
}

/** Higher = needs more attention. */
function weakness(word: BubbleWord): number {
  const level = levelOf(word);
  const base = { weak: 4, learning: 3, todo: 2, known: 1, mastered: 0 }[level];
  return base * 100 + Math.min(word.wrong, 99);
}

export function countByLevel(words: BubbleWord[]): Record<MasteryLevel, number> {
  const counts: Record<MasteryLevel, number> = { todo: 0, learning: 0, weak: 0, known: 0, mastered: 0 };
  for (const word of words) counts[levelOf(word)] += 1;
  return counts;
}

/** Tailwind classes of one bubble per level (soft background, strong text, matching border). */
export const BUBBLE_CLASS: Record<MasteryLevel, string> = {
  todo: "bg-paper-deep text-ink-soft border-line",
  learning: "bg-cyan/12 text-cyan border-cyan/30",
  weak: "bg-pen-red/10 text-pen-red border-pen-red/30",
  known: "bg-indigo/10 text-indigo border-indigo/30",
  mastered: "bg-leaf/12 text-leaf border-leaf/35",
};
