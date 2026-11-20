import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanSupabaseUrl } from "@/lib/env";

export type CheckLevel = "must" | "should";

export interface Check {
  id: string;
  level: CheckLevel;
  ok: boolean;
  /** A number shown beside the check, such as how many words are uploaded. */
  count?: number;
}

export interface Readiness {
  checks: Check[];
  /** Everything marked "must" passes. */
  ready: boolean;
}

const TABLES = [
  "profiles", "words", "school_units", "school_words", "grammar_lessons", "bo_messages", "daily_challenges",
  "challenge_results", "word_of_day", "board_members", "contests", "contest_entries", "duels", "duel_entries",
  "feedback", "shared_hooks", "grammar_topics", "admin_log", "memberships", "plus_codes", "plus_attempts", "path_cards", "app_settings",
] as const;

export function summarize(checks: Check[]): Readiness {
  return { checks, ready: checks.filter((check) => check.level === "must").every((check) => check.ok) };
}

interface Filter {
  eq?: Record<string, string | boolean>;
  gte?: Record<string, string>;
}

/** Row count of a table, or null when the table is missing (the setup file was not run). */
async function countOf(db: SupabaseClient, table: string, filter: Filter = {}): Promise<number | null> {
  let query = db.from(table).select("*", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filter.eq ?? {})) query = query.eq(column, value);
  for (const [column, value] of Object.entries(filter.gte ?? {})) query = query.gte(column, value);
  const { count, error } = await query;
  return error ? null : (count ?? 0);
}

/**
 * Looks at the real project: variables, tables, content and the AI. Nothing here writes, and no secret value leaves the server:
 * only yes or no.
 */
export async function checkReadiness(db: SupabaseClient): Promise<Readiness> {
  const checks: Check[] = [
    { id: "env.url", level: "must", ok: /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) || /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) },
    { id: "env.anon", level: "must", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { id: "env.service", level: "must", ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { id: "env.gemini", level: "must", ok: Boolean(process.env.GEMINI_API_KEY) },
    { id: "env.site", level: "should", ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL) },
  ];

  const tableCounts = await Promise.all(TABLES.map((table) => countOf(db, table)));
  const missing = TABLES.filter((_, i) => tableCounts[i] === null).length;
  checks.push({ id: "db.tables", level: "must", ok: missing === 0, count: missing });

  const board = await db.rpc("weekly_board", { week_start: "2026-01-01", me: "00000000-0000-0000-0000-000000000000", max_rows: 1 });
  checks.push({ id: "db.board", level: "must", ok: !board.error });

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [schoolWords, grammar, boMessages, wordsOfDay, cards, admins, aiRecent, aiFailed, contests] = await Promise.all([
    countOf(db, "school_words"),
    countOf(db, "grammar_lessons"),
    countOf(db, "bo_messages", { eq: { active: true } }),
    countOf(db, "word_of_day", { eq: { active: true } }),
    countOf(db, "path_cards"),
    countOf(db, "profiles", { eq: { role: "admin" } }),
    countOf(db, "ai_usage", { gte: { created_at: since } }),
    countOf(db, "ai_usage", { gte: { created_at: since }, eq: { ok: false } }),
    countOf(db, "contests", { eq: { active: true } }),
  ]);

  checks.push(
    { id: "db.admin", level: "must", ok: (admins ?? 0) > 0, count: admins ?? 0 },
    { id: "content.school", level: "must", ok: (schoolWords ?? 0) > 0, count: schoolWords ?? 0 },
    { id: "content.grammar", level: "should", ok: (grammar ?? 0) > 0, count: grammar ?? 0 },
    { id: "content.cards", level: "should", ok: (cards ?? 0) > 0, count: cards ?? 0 },
    { id: "content.bo", level: "should", ok: (boMessages ?? 0) >= 3, count: boMessages ?? 0 },
    { id: "content.wod", level: "should", ok: (wordsOfDay ?? 0) >= 7, count: wordsOfDay ?? 0 },
    { id: "content.contest", level: "should", ok: (contests ?? 0) > 0, count: contests ?? 0 },
    // The AI is healthy when nothing ran yet, or when most of the last day's calls worked.
    { id: "ai.health", level: "should", ok: (aiRecent ?? 0) === 0 || (aiFailed ?? 0) / (aiRecent ?? 1) < 0.2, count: aiFailed ?? 0 },
  );
  return summarize(checks);
}
