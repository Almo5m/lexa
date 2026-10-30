import type { SupabaseClient } from "@supabase/supabase-js";
import { parseStored, type StoredQuestion } from "@/features/challenge/questions";

export interface Standing {
  score: number;
  me: boolean;
  creator: boolean;
}

export function isMissingDuelTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || /duels|duel_entries/.test(error?.message ?? ""));
}

export async function loadDuel(db: SupabaseClient, code: string): Promise<{ questions: StoredQuestion[]; creator: string } | null> {
  const { data, error } = await db.from("duels").select("questions, creator").eq("code", code).maybeSingle();
  if (isMissingDuelTable(error)) return null;
  if (error) throw error;
  if (!data) return null;
  const questions = parseStored(data.questions);
  return questions.length > 0 ? { questions, creator: data.creator } : null;
}

/** Everyone who played this duel, best first. Names stay out: a student sees only "you", "the one who challenged" and scores. */
export async function standings(db: SupabaseClient, code: string, creator: string, me: string): Promise<Standing[]> {
  const { data, error } = await db.from("duel_entries").select("user_id, score").eq("code", code).order("score", { ascending: false }).order("created_at", { ascending: true }).limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => ({ score: row.score, me: row.user_id === me, creator: row.user_id === creator }));
}
