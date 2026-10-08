import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppSettings } from "@/lib/settings";
import { applyProgress } from "@/features/gamification/award";
import { comboBonus, levelFromXp } from "@/features/gamification/xp";
import { classifyWord, isDue, scheduleReview } from "./scheduler";
import type { Grade, SrsState, WordStatus } from "./types";

export type AnswerMode = "recall" | "write" | "listen" | "quiz" | "translate";

export interface WordStateRow {
  id: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  correct_count: number;
  wrong_count: number;
  due_at: string;
  last_reviewed_at: string | null;
}

export interface AnswerOutcome {
  status: WordStatus;
  nextDueAt: string;
  countedForProgress: boolean;
  xpGained: number;
  totalXp: number | null;
  levelUp: boolean;
  goalReachedNow: boolean;
}

interface ApplyInput {
  supabase: SupabaseClient;
  userId: string;
  word: WordStateRow;
  mode: AnswerMode;
  grade: Grade;
  settings: AppSettings;
  combo?: number;
  now?: Date;
}

/**
 * One place that turns an answer into spaced-repetition state, XP and streak.
 * A word that is not due can be practiced, but it changes nothing and earns nothing.
 */
export async function applyAnswer(input: ApplyInput): Promise<AnswerOutcome> {
  const { supabase, userId, word, mode, grade, settings } = input;
  const now = input.now ?? new Date();
  const correct = grade !== "again";

  const before: SrsState = {
    ease: word.ease,
    intervalDays: word.interval_days,
    repetitions: word.repetitions,
    lapses: word.lapses,
    correctCount: word.correct_count,
    wrongCount: word.wrong_count,
    dueAt: word.due_at,
    lastReviewedAt: word.last_reviewed_at,
  };

  const firstTime = before.lastReviewedAt === null;
  const counts = firstTime || isDue(before, now);
  const after = counts ? scheduleReview(before, grade, settings, now) : before;

  const outcome: AnswerOutcome = {
    status: classifyWord(after, settings),
    nextDueAt: after.dueAt,
    countedForProgress: counts,
    xpGained: 0,
    totalXp: null,
    levelUp: false,
    goalReachedNow: false,
  };
  if (!counts) return outcome;

  await supabase
    .from("words")
    .update({
      ease: after.ease,
      interval_days: after.intervalDays,
      repetitions: after.repetitions,
      lapses: after.lapses,
      correct_count: after.correctCount,
      wrong_count: after.wrongCount,
      due_at: after.dueAt,
      last_reviewed_at: after.lastReviewedAt,
    })
    .eq("id", word.id);
  await supabase.from("review_logs").insert({ user_id: userId, word_id: word.id, mode, grade });

  let xp = 0;
  if (firstTime) xp += settings.xpNewWord;
  if (correct) xp += settings.xpCorrectAnswer + comboBonus(input.combo ?? 0);

  const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", userId).single();
  const result = await applyProgress(
    userId,
    { newWords: firstTime ? 1 : 0, reviews: firstTime ? 0 : 1, xp },
    settings,
    now,
  );

  outcome.xpGained = xp + result.bonusXp;
  outcome.totalXp = result.totalXp;
  outcome.goalReachedNow = result.goalReachedNow;
  outcome.levelUp = levelFromXp(result.totalXp) > levelFromXp(profile?.total_xp ?? 0);
  return outcome;
}
