import type { SupabaseClient } from "@supabase/supabase-js";
import { isPlus } from "./plan";

export function isMissingPlusTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || error?.code === "PGRST202" || /memberships|plus_codes|redeem_plus_code|grant_plus/.test(error?.message ?? ""));
}

/** When this student's Plus ends, or null. A missing table (setup.sql not re-run yet) counts as no Plus. Service client only. */
export async function loadPlusUntil(db: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await db.from("memberships").select("plus_until").eq("user_id", userId).maybeSingle();
  if (error) return null;
  return data?.plus_until ?? null;
}

export async function hasPlus(db: SupabaseClient, userId: string): Promise<boolean> {
  return isPlus(await loadPlusUntil(db, userId));
}
