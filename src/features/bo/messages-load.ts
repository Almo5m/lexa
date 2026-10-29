import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoMessage } from "./messages";

const MAX_LOADED = 100;

/** The active messages in the student's language (Arabic when the English text is empty). A missing table means none. */
export async function loadBoMessages(supabase: SupabaseClient, lang: "ar" | "en"): Promise<BoMessage[]> {
  const { data, error } = await supabase.from("bo_messages").select("id, text_ar, text_en").eq("active", true).order("created_at", { ascending: false }).limit(MAX_LOADED);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205" || /bo_messages/.test(error.message ?? "")) return [];
    throw error;
  }
  return (data ?? []).flatMap((row: { id: string; text_ar: string; text_en: string }) => {
    const text = lang === "en" && row.text_en.trim() ? row.text_en : row.text_ar;
    return text.trim() ? [{ id: row.id, text }] : [];
  });
}
