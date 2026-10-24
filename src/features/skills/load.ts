import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { QUESTION_COUNT } from "@/features/reading/schemas";
import type { StoredSession } from "@/features/talk/analyze";
import { bookMeter } from "@/features/book/progress";
import { GRAMMAR_UNITS } from "@/features/grammar";
import { LISTENING_TASKS } from "@/features/listening/tasks";
import { WRITING_TASKS } from "@/features/writing/tasks";
import { readingMeter, speakMeter, translateMeter, wordsMeter, type Meter } from "./meters";

export interface LoadedMeters {
  words: Meter;
  read: Meter;
  translate: Meter;
  speak: Meter;
  book: Meter;
}

/**
 * The four skill bars, worked out from what the student actually did. Reading sessions have no student policy,
 * so they are read with the admin client and always filtered by this student's id.
 */
export async function loadSkillMeters(
  supabase: SupabaseClient,
  userId: string,
  words: { learned: number; total: number },
): Promise<LoadedMeters> {
  const admin = createSupabaseAdminClient();
  const [{ data: translateLogs }, { data: readingRows }, { data: talkRows }, { data: bookRows }] = await Promise.all([
    supabase.from("review_logs").select("grade").eq("mode", "translate").order("created_at", { ascending: false }).limit(20),
    admin.from("reading_sessions").select("answers").eq("user_id", userId).not("completed_at", "is", null).order("day", { ascending: false }).limit(10),
    supabase.from("talk_sessions").select("vocabulary_level, grammar_level, clarity_level, mistakes, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("book_scores").select("item_id, score, max_score"),
  ]);
  return {
    words: wordsMeter(words.learned, words.total),
    read: readingMeter((readingRows ?? []).map((row) => ({ answers: row.answers as { correct: boolean }[] | null, questions: QUESTION_COUNT }))),
    translate: translateMeter((translateLogs ?? []).map((row) => row.grade)),
    speak: speakMeter((talkRows ?? []) as unknown as StoredSession[]),
    book: bookMeter(bookRows ?? [], GRAMMAR_UNITS.length + WRITING_TASKS.length + LISTENING_TASKS.length),
  };
}
