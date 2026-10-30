import type { SupabaseClient } from "@supabase/supabase-js";
import { PATH } from "@/features/curriculum";
import { loadSchoolUnits } from "@/features/school/load";
import { buildQuestions, parseStored, type PoolWord, type StoredQuestion } from "./questions";

function missingTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || /daily_challenges|challenge_results/.test(error?.message ?? ""));
}

/** The words the questions come from: the school curriculum first, our own path when there are not enough of them. */
export async function loadPool(db: SupabaseClient): Promise<PoolWord[]> {
  const school = (await loadSchoolUnits(db)).flatMap((unit) => unit.words.map((word) => ({ term: word.term, meaningAr: word.meaningAr })));
  if (new Set(school.map((word) => word.meaningAr)).size >= 8) return school;
  return PATH.map((entry) => ({ term: entry.en, meaningAr: entry.ar }));
}

/**
 * The questions of one day. The first request of the day makes them and stores them, so every student gets the same
 * set all day even if the admin changes the words meanwhile. Service client only: the answers are in the stored set.
 */
export async function challengeForDay(db: SupabaseClient, day: string): Promise<StoredQuestion[]> {
  const first = await db.from("daily_challenges").select("questions").eq("day", day).maybeSingle();
  if (missingTable(first.error)) return [];
  if (first.error) throw first.error;
  const stored = parseStored(first.data?.questions);
  if (stored.length > 0) return stored;

  const questions = buildQuestions(await loadPool(db), day);
  if (questions.length === 0) return [];
  const { error } = await db.from("daily_challenges").upsert({ day, questions }, { onConflict: "day", ignoreDuplicates: true });
  if (error) throw error;
  // Two students may arrive together: whoever was stored first wins, and everyone reads that one.
  const again = await db.from("daily_challenges").select("questions").eq("day", day).maybeSingle();
  const winner = parseStored(again.data?.questions);
  return winner.length > 0 ? winner : questions;
}

export async function resultForDay(db: SupabaseClient, userId: string, day: string): Promise<{ score: number; max: number } | null> {
  const { data, error } = await db.from("challenge_results").select("score, max_score").eq("user_id", userId).eq("day", day).maybeSingle();
  if (missingTable(error)) return null;
  if (error) throw error;
  return data ? { score: data.score, max: data.max_score } : null;
}
