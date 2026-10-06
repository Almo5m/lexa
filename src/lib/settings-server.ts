import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { mergeSettings, type AppSettings } from "@/lib/settings";

export async function loadSettings(): Promise<AppSettings> {
  const { data } = await createSupabaseAdminClient()
    .from("app_settings")
    .select("values")
    .eq("id", 1)
    .single();
  return mergeSettings(data?.values);
}
