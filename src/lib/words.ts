import type { WordCard } from "@/features/ai/schemas";
import type { SrsState, WordStatus } from "@/features/srs/types";
import { classifyWord } from "@/features/srs/scheduler";
import type { AppSettings } from "@/lib/settings";

export interface WordRow {
  id: string;
  term: string;
  card: WordCard | null;
  card_status: "pending" | "ready" | "failed";
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  correct_count: number;
  wrong_count: number;
  due_at: string;
  last_reviewed_at: string | null;
  group_id: string | null;
}

export function rowToState(row: WordRow): SrsState {
  return {
    ease: row.ease,
    intervalDays: row.interval_days,
    repetitions: row.repetitions,
    lapses: row.lapses,
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    dueAt: row.due_at,
    lastReviewedAt: row.last_reviewed_at,
  };
}

export function statusOf(row: WordRow, settings: AppSettings): WordStatus {
  return classifyWord(rowToState(row), settings);
}
