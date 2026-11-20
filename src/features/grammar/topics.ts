import type { SupabaseClient } from "@supabase/supabase-js";

export interface GrammarTopic {
  id: string;
  stage: string;
  title: string;
}

/** True when the topics table is not in the database yet (setup.sql was not run after this update). */
export function missingTopics(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || /grammar_topics/.test(error?.message ?? ""));
}

/** The extra grammar lessons, in the order the admin set, optionally for one stage only. Works with a student's or the admin's client. */
export async function loadTopics(db: SupabaseClient, stage?: string | null): Promise<GrammarTopic[]> {
  let query = db.from("grammar_topics").select("id, stage, title").order("sort").order("created_at");
  if (stage) query = query.eq("stage", stage);
  const { data, error } = await query;
  if (missingTopics(error)) return [];
  if (error) throw error;
  return (data ?? []) as GrammarTopic[];
}

export async function topicExists(db: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await db.from("grammar_topics").select("id").eq("id", id).maybeSingle();
  if (missingTopics(error)) return false;
  if (error) throw error;
  return Boolean(data);
}
