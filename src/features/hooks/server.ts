import type { SupabaseClient } from "@supabase/supabase-js";
import type { HookInfo } from "./hooks";

export function isMissingHookTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || /shared_hooks|my_hook/.test(error?.message ?? ""));
}

/** Hook information for some words of one student. A missing table (setup.sql not re-run) just means no hooks. Service client only. */
export async function loadHookInfo(db: SupabaseClient, userId: string, terms: string[]): Promise<Map<string, HookInfo>> {
  const out = new Map<string, HookInfo>();
  const unique = [...new Set(terms.map((term) => term.toLowerCase()))];
  for (const term of unique) out.set(term, { mine: null, status: null, shared: null });
  if (unique.length === 0) return out;

  const [mine, approved, own] = await Promise.all([
    db.from("words").select("term, my_hook").eq("user_id", userId).in("term", unique),
    db.from("shared_hooks").select("term, hook, author_name, created_at").eq("status", "approved").in("term", unique).order("created_at", { ascending: false }),
    db.from("shared_hooks").select("term, status").eq("user_id", userId).in("term", unique),
  ]);
  for (const row of mine.data ?? []) {
    const info = out.get(row.term.toLowerCase());
    if (info) info.mine = row.my_hook ?? null;
  }
  for (const row of approved.data ?? []) {
    const info = out.get(row.term);
    if (info && !info.shared) info.shared = { hook: row.hook, author: row.author_name };
  }
  for (const row of own.data ?? []) {
    const info = out.get(row.term);
    if (info) info.status = row.status;
  }
  return out;
}
