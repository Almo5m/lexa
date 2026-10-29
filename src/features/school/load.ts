import type { SupabaseClient } from "@supabase/supabase-js";
import type { SchoolUnit, SchoolWord } from "./types";

/**
 * True when the school tables are not in the database yet (setup.sql was not run after this update).
 * The site then simply behaves as if no school words exist, instead of failing on every page.
 */
export function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /school_(units|words)/.test(error.message ?? "");
}

interface UnitRow {
  id: string;
  title_ar: string;
  title_en: string;
}
interface WordRow {
  id: string;
  unit_id: string;
  term: string;
  pos: string;
  meaning_ar: string;
  example_en: string;
  example_ar: string;
}

/** One school unit with its words, or null when the id is unknown. */
export async function loadSchoolUnit(supabase: SupabaseClient, id: string): Promise<SchoolUnit | null> {
  const [unit, words] = await Promise.all([
    supabase.from("school_units").select("id, title_ar, title_en").eq("id", id).maybeSingle(),
    supabase.from("school_words").select("id, unit_id, term, pos, meaning_ar, example_en, example_ar").eq("unit_id", id).order("sort").order("created_at").limit(2000),
  ]);
  if (isMissingTable(unit.error) || isMissingTable(words.error)) return null;
  if (unit.error) throw unit.error;
  if (words.error) throw words.error;
  if (!unit.data) return null;
  return {
    id: unit.data.id,
    titleAr: unit.data.title_ar,
    titleEn: unit.data.title_en,
    words: ((words.data ?? []) as WordRow[]).map((row) => ({ id: row.id, unitId: row.unit_id, term: row.term, pos: row.pos, meaningAr: row.meaning_ar, exampleEn: row.example_en, exampleAr: row.example_ar })),
  };
}

/** Every school unit with its words, in the order the admin set. Works with a student's or the admin's client. */
export async function loadSchoolUnits(supabase: SupabaseClient): Promise<SchoolUnit[]> {
  const [units, words] = await Promise.all([
    supabase.from("school_units").select("id, title_ar, title_en").order("sort").order("created_at"),
    supabase.from("school_words").select("id, unit_id, term, pos, meaning_ar, example_en, example_ar").order("sort").order("created_at").limit(10000),
  ]);
  if (isMissingTable(units.error) || isMissingTable(words.error)) return [];
  if (units.error) throw units.error;
  if (words.error) throw words.error;

  const byUnit = new Map<string, SchoolWord[]>();
  for (const row of (words.data ?? []) as WordRow[]) {
    const list = byUnit.get(row.unit_id) ?? [];
    list.push({ id: row.id, unitId: row.unit_id, term: row.term, pos: row.pos, meaningAr: row.meaning_ar, exampleEn: row.example_en, exampleAr: row.example_ar });
    byUnit.set(row.unit_id, list);
  }
  return ((units.data ?? []) as UnitRow[]).map((unit) => ({
    id: unit.id,
    titleAr: unit.title_ar,
    titleEn: unit.title_en,
    words: byUnit.get(unit.id) ?? [],
  }));
}
