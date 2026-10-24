import type { SupabaseClient } from "@supabase/supabase-js";
import type { WordCard } from "@/features/ai/schemas";
import { parseStoredCard } from "./path-cards";

/** The finished cards that exist for these words. A word with no card, or a damaged one, is simply left out. */
export async function loadPathCards(supabase: SupabaseClient, terms: readonly string[]): Promise<Map<string, WordCard>> {
  const found = new Map<string, WordCard>();
  if (terms.length === 0) return found;
  const { data, error } = await supabase.from("path_cards").select("term, card").in("term", [...terms]);
  if (error) throw error;
  for (const row of data ?? []) {
    const card = parseStoredCard(row.card);
    if (card) found.set(row.term, card);
  }
  return found;
}
