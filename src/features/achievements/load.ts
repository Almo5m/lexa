import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { BadgeStats } from "./badges";

const GRAMMAR_GOOD = 0.8;
const WRITING_GOOD = 15;

/** Counts what the student really did. Reading sessions have no student policy, so they are read with the admin client for this student only. */
export async function loadBadgeStats(supabase: SupabaseClient, userId: string): Promise<BadgeStats> {
  const [{ data: profile }, { count: words }, { count: read }, { count: translate }, { count: talk }, { data: book }] = await Promise.all([
    supabase.from("profiles").select("total_xp, streak_longest, streak_current").eq("id", userId).single(),
    supabase.from("words").select("id", { count: "exact", head: true }).not("last_reviewed_at", "is", null),
    createSupabaseAdminClient().from("reading_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).not("completed_at", "is", null),
    supabase.from("review_logs").select("id", { count: "exact", head: true }).eq("mode", "translate"),
    supabase.from("talk_sessions").select("id", { count: "exact", head: true }),
    supabase.from("book_scores").select("kind, score, max_score"),
  ]);
  const rows = book ?? [];
  return {
    words: words ?? 0,
    streak: Math.max(profile?.streak_longest ?? 0, profile?.streak_current ?? 0),
    xp: profile?.total_xp ?? 0,
    read: read ?? 0,
    translate: translate ?? 0,
    talk: talk ?? 0,
    grammar: rows.filter((row) => row.kind === "grammar" && row.score / row.max_score >= GRAMMAR_GOOD).length,
    writing: rows.filter((row) => row.kind === "writing" && row.score >= WRITING_GOOD).length,
    listening: rows.filter((row) => row.kind === "listening" && row.score === row.max_score).length,
  };
}
