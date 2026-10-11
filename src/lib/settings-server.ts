import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { mergeSettings, type AppSettings } from "@/lib/settings";

const TTL_MS = 30_000;
let cached: { at: number; value: AppSettings } | null = null;

/** Settings change rarely, so they are cached for a short time instead of read on every request. */
export async function loadSettings(): Promise<AppSettings> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const { data } = await createSupabaseAdminClient()
    .from("app_settings")
    .select("values")
    .eq("id", 1)
    .single();
  const value = mergeSettings(data?.values);
  cached = { at: Date.now(), value };
  return value;
}

export function clearSettingsCache(): void {
  cached = null;
}
