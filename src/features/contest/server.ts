import type { SupabaseClient } from "@supabase/supabase-js";
import { parseStoredContest, type ContestQuestion } from "./parse";

export interface ContestRow {
  id: string;
  title: string;
  prize: string;
  questions: ContestQuestion[];
  startsAt: string;
  endsAt: string;
}

export function isMissingContestTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || /contests|contest_entries/.test(error?.message ?? ""));
}

/** The contest to show students: the one running now, else the one that ended last (for results). Service client only. */
export async function currentContest(db: SupabaseClient, now = new Date()): Promise<{ contest: ContestRow | null; state: "running" | "ended" | "none" | "missing" }> {
  const { data, error } = await db.from("contests").select("id, title, prize, questions, starts_at, ends_at").eq("active", true).lte("starts_at", now.toISOString()).order("ends_at", { ascending: false }).limit(1);
  if (isMissingContestTable(error)) return { contest: null, state: "missing" };
  if (error) throw error;
  const row = data?.[0];
  if (!row) return { contest: null, state: "none" };
  const contest: ContestRow = { id: row.id, title: row.title, prize: row.prize, questions: parseStoredContest(row.questions), startsAt: row.starts_at, endsAt: row.ends_at };
  return { contest, state: new Date(contest.endsAt) > now ? "running" : "ended" };
}
