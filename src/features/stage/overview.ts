/**
 * "My curriculum": every part of the student's school year in one list, with how far he is in each.
 * Pure function over numbers the page already loaded, so the rules are easy to test.
 */
export const PARTS = ["words", "grammar", "writing", "listening", "speaking"] as const;
export type CurriculumPart = (typeof PARTS)[number];

export interface PartCard {
  id: CurriculumPart;
  href: string;
  /** Items finished, or null when this part is not tracked (reading an explanation, free speaking). */
  done: number | null;
  /** Items in this part, or null when it is open-ended. */
  total: number | null;
  /** 0-100 when it can be measured. */
  percent: number | null;
  state: "empty" | "todo" | "progress" | "done";
}

export interface OverviewInput {
  /** The ministry book we hold (third secondary) or an unchosen account. */
  book: boolean;
  wordsTotal: number;
  wordsStarted: number;
  grammarTopics: number;
  /** Best scores of the book tasks, with the kind they belong to. */
  scores: { kind: "grammar" | "writing" | "listening"; item_id: string }[];
  grammarUnits: number;
  writingTasks: number;
  listeningTasks: number;
}

function card(id: CurriculumPart, href: string, done: number | null, total: number | null): PartCard {
  if (total === 0) return { id, href, done, total, percent: null, state: "empty" };
  if (done === null || total === null) return { id, href, done, total, percent: null, state: "todo" };
  const percent = Math.round((Math.min(done, total) / total) * 100);
  return { id, href, done, total, percent, state: done >= total ? "done" : done > 0 ? "progress" : "todo" };
}

export function buildOverview(input: OverviewInput): { parts: PartCard[]; overall: number | null; next: PartCard | null } {
  const tried = (kind: "grammar" | "writing" | "listening") => new Set(input.scores.filter((s) => s.kind === kind).map((s) => s.item_id)).size;

  const parts: PartCard[] = [card("words", "/words", input.wordsStarted, input.wordsTotal)];
  if (input.book) {
    parts.push(
      card("grammar", "/grammar", tried("grammar"), input.grammarUnits),
      card("writing", "/writing", tried("writing"), input.writingTasks),
      card("listening", "/listening", tried("listening"), input.listeningTasks),
      card("speaking", "/talk", null, null),
    );
  } else {
    parts.push(card("grammar", "/grammar", null, input.grammarTopics), card("speaking", "/talk", null, null));
  }

  const measured = parts.filter((part) => part.percent !== null);
  const overall = measured.length === 0 ? null : Math.round(measured.reduce((sum, part) => sum + (part.percent ?? 0), 0) / measured.length);
  // The next step: the first measurable part still in progress, else the first not started one that has content.
  const next = parts.find((p) => p.state === "progress") ?? parts.find((p) => p.state === "todo" && p.total !== null) ?? null;
  return { parts, overall, next };
}
