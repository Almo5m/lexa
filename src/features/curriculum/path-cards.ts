import { cardSchema, type WordCard } from "@/features/ai/schemas";
import { PATH, type PathEntry } from "./index";
import type { PathWord } from "./types";

/** Cards written per request from the admin panel. Small, so one request finishes well inside the time limit. */
export const GENERATE_BATCH = 8;

/** The teacher-written meanings come first; the AI's extra meanings only follow them, at most three in all. */
export function mergeCurated(entry: PathWord, card: WordCard): WordCard {
  const curated = entry.ar.split(/[،,]/).map((part) => part.trim()).filter(Boolean);
  return { ...card, term: entry.en, meaningsAr: [...new Set([...curated, ...card.meaningsAr])].slice(0, 3) };
}

/** The next words that do not have a finished card yet, in teaching order. */
export function missingEntries(have: ReadonlySet<string>, count: number): PathEntry[] {
  return PATH.filter((entry) => !have.has(entry.en)).slice(0, Math.max(0, count));
}

/** A card read back from the database, or null when it does not match the card shape. */
export function parseStoredCard(value: unknown): WordCard | null {
  const parsed = cardSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export interface StoredPathCard {
  term: string;
  card: WordCard;
  reviewed: boolean;
}

const CSV_HEADER = ["term", "pos", "ipa", "meaning_ar", "sentence", "sentence_ar", "situation_ar", "usage_note_ar", "memory_hook_ar", "examples", "related", "reviewed"];

const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** One row per card, for the teacher. UTF-8 with a BOM so Excel reads the Arabic. */
export function cardsToCsv(rows: readonly StoredPathCard[]): string {
  const lines = rows.map(({ term, card, reviewed }) =>
    [
      term,
      card.partOfSpeech,
      card.ipa,
      card.meaningsAr.join(" / "),
      card.sentence,
      card.sentenceAr,
      card.situationAr,
      card.usageNoteAr,
      card.memoryHookAr,
      card.extraExamples.map((item) => `${item.en} = ${item.ar}`).join(" | "),
      card.related.map((item) => `${item.word}: ${item.noteAr}`).join(" | "),
      reviewed ? "yes" : "no",
    ]
      .map(cell)
      .join(","),
  );
  return `﻿${[CSV_HEADER.map(cell).join(","), ...lines].join("\r\n")}\r\n`;
}
