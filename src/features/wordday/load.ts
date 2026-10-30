import type { SupabaseClient } from "@supabase/supabase-js";

export interface WordOfDay {
  id: string;
  term: string;
  meaningAr: string;
  story: string;
}

/** The active words of the day in the student's language (the Arabic story when there is no English one). A missing table means none. */
export async function loadWordsOfDay(supabase: SupabaseClient, lang: "ar" | "en"): Promise<WordOfDay[]> {
  const { data, error } = await supabase.from("word_of_day").select("id, term, meaning_ar, story_ar, story_en").eq("active", true).order("created_at").limit(400);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || /word_of_day/.test(error.message ?? "")) return [];
    throw error;
  }
  return (data ?? []).map((row: { id: string; term: string; meaning_ar: string; story_ar: string; story_en: string }) => ({
    id: row.id,
    term: row.term,
    meaningAr: row.meaning_ar,
    story: lang === "en" && row.story_en.trim() ? row.story_en : row.story_ar,
  }));
}

/** One word for the whole day, the same for every student, going through the list in turn. */
export function wordForDay<T>(items: readonly T[], day: string): T | null {
  if (items.length === 0) return null;
  const days = Math.floor(new Date(`${day}T00:00:00Z`).getTime() / 86_400_000);
  return items[((days % items.length) + items.length) % items.length];
}
