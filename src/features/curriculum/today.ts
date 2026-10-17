import type { SupabaseClient } from "@supabase/supabase-js";
import { pickReadingWords } from "@/features/reading/select";

/** The topic id the speak step uses; the server rebuilds its words itself, the browser only names it. */
export const WORDS_TOPIC = "words";
export const SPEAK_WORDS = 4;
export const TRANSLATE_WORDS = 5;

/** The words the student learned most recently. Translate, speak and reading are all written around them. */
export async function recentWords(supabase: SupabaseClient, limit: number): Promise<string[]> {
  const { data } = await supabase
    .from("words")
    .select("term, last_reviewed_at")
    .eq("card_status", "ready")
    .not("last_reviewed_at", "is", null)
    .order("last_reviewed_at", { ascending: false })
    .limit(40);
  return pickReadingWords(data ?? []).slice(0, limit);
}

export function wordsTopicPrompt(words: string[]): string {
  return `Write 3 to 5 sentences about your day, your family or your friends. Use at least two of these words: ${words.join(", ")}.`;
}
