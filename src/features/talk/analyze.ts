import { MISTAKE_TYPES, type MistakeType, type TalkMistake } from "./schemas";

export const MIN_CHARS = 20;
export const MAX_CHARS = 800;

/** The text must be mostly English letters, so Arabic or gibberish is not sent to the AI. */
export function looksEnglish(text: string): boolean {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length < 10) return false;
  const latin = letters.filter((char) => /[A-Za-z]/.test(char)).length;
  return latin / letters.length >= 0.8;
}

const BANDS = ["A1", "A2", "B1", "B2", "C1"] as const;

export function bandLabel(level: number): string {
  return BANDS[Math.min(5, Math.max(1, Math.round(level))) - 1];
}

export interface StoredSession {
  vocabulary_level: number;
  grammar_level: number;
  clarity_level: number;
  mistakes: TalkMistake[] | null;
  created_at: string;
}

export interface MistakeCount {
  type: MistakeType;
  count: number;
}

/** The most repeated kinds of mistakes, so the student sees patterns instead of single errors. */
export function topMistakeTypes(sessions: Pick<StoredSession, "mistakes">[], limit = 3): MistakeCount[] {
  const counts = new Map<MistakeType, number>();
  for (const session of sessions) {
    for (const mistake of session.mistakes ?? []) {
      if (!(MISTAKE_TYPES as readonly string[]).includes(mistake.type)) continue;
      counts.set(mistake.type, (counts.get(mistake.type) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([type]) => type !== "other")
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface LevelTrend {
  vocabulary: number;
  grammar: number;
  clarity: number;
}

/** Average of the latest sessions (newest first in the input). Smooths out one lucky or unlucky text. */
export function recentAverage(sessions: StoredSession[], take = 3): LevelTrend | null {
  const recent = sessions.slice(0, take);
  if (recent.length === 0) return null;
  const avg = (pick: (s: StoredSession) => number) => recent.reduce((sum, s) => sum + pick(s), 0) / recent.length;
  return {
    vocabulary: avg((s) => s.vocabulary_level),
    grammar: avg((s) => s.grammar_level),
    clarity: avg((s) => s.clarity_level),
  };
}
