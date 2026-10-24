import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { keepBest } from "./progress";

/** Saves the best result of a grammar unit or writing task. Always called after the server has worked out the real score and maximum. */
export async function saveBookScore(userId: string, itemId: string, kind: "grammar" | "writing" | "listening", score: number, max: number): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("book_scores").select("score, attempts").eq("user_id", userId).eq("item_id", itemId).maybeSingle();
  const { error } = await admin.from("book_scores").upsert(
    {
      user_id: userId,
      item_id: itemId,
      kind,
      score: keepBest(existing?.score ?? null, score),
      max_score: max,
      attempts: (existing?.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );
  if (error) throw error;
}
