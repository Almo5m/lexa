import type { SupabaseClient } from "@supabase/supabase-js";
import type { BadgeCounts } from "./nav";

/** What waits for the admin: open student messages and hooks to review. A missing table (setup.sql not re-run) counts as zero. Service client only. */
export async function loadBadgeCounts(db: SupabaseClient): Promise<BadgeCounts> {
  const [feedback, hooks] = await Promise.all([
    db.from("feedback").select("id", { count: "exact", head: true }).eq("done", false),
    db.from("shared_hooks").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return { feedback: feedback.error ? 0 : (feedback.count ?? 0), hooks: hooks.error ? 0 : (hooks.count ?? 0) };
}
