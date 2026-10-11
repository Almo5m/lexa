import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings-server";
import { levelFromXp } from "@/features/gamification/xp";
import { recentAverage, topMistakeTypes, type MistakeCount, type LevelTrend, type StoredSession } from "@/features/talk/analyze";
import { statusOf, type WordRow } from "@/lib/words";

export interface ProgressReport {
  firstName: string;
  level: number;
  totalXp: number;
  streak: number;
  longestStreak: number;
  words: { total: number; mastered: number; weak: number };
  /** Number of answers per day for the last seven days, oldest first. */
  week: { day: string; answers: number }[];
  language: { average: LevelTrend; patterns: MistakeCount[]; texts: number } | null;
}

/** Only the first name is shared. */
export function firstNameOf(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? "";
}

export function lastSevenDays(now: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => new Date(now.getTime() - (6 - i) * 86_400_000).toISOString().slice(0, 10));
}

/**
 * Builds the summary shown to a parent or teacher. It never includes the student's words,
 * his texts, his email, or anything that identifies him beyond his first name.
 */
export async function buildProgressReport(userId: string, now = new Date()): Promise<ProgressReport | null> {
  const db = createSupabaseAdminClient();
  const settings = await loadSettings();
  const days = lastSevenDays(now);
  const since = `${days[0]}T00:00:00Z`;

  const [{ data: profile }, { data: wordsData }, { data: logs }, { data: talk }] = await Promise.all([
    db.from("profiles").select("display_name, total_xp, streak_current, streak_longest").eq("id", userId).single(),
    db
      .from("words")
      .select("id, term, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id")
      .eq("user_id", userId),
    db.from("review_logs").select("created_at").eq("user_id", userId).gte("created_at", since).limit(5000),
    db
      .from("talk_sessions")
      .select("vocabulary_level, grammar_level, clarity_level, mistakes, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (!profile) return null;

  const words = (wordsData ?? []) as unknown as WordRow[];
  const statuses = words.map((word) => statusOf(word, settings));
  const counts = new Map(days.map((day) => [day, 0]));
  for (const log of logs ?? []) {
    const key = String(log.created_at).slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sessions = (talk ?? []) as unknown as StoredSession[];
  const average = recentAverage(sessions);

  return {
    firstName: firstNameOf(profile.display_name ?? ""),
    level: levelFromXp(profile.total_xp),
    totalXp: profile.total_xp,
    streak: profile.streak_current,
    longestStreak: profile.streak_longest,
    words: {
      total: words.length,
      mastered: statuses.filter((status) => status === "mastered").length,
      weak: statuses.filter((status) => status === "weak").length,
    },
    week: days.map((day) => ({ day, answers: counts.get(day) ?? 0 })),
    language: average ? { average, patterns: topMistakeTypes(sessions), texts: sessions.length } : null,
  };
}
