import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { AdminCodes, type Batch } from "@/components/admin-codes";
import { formatCode } from "@/features/plus/codes";

/** Activation codes: make a batch, see how many were used, take the unused ones to send or sell. */
export async function CodesTab() {
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("plus_codes").select("code, days, label, created_at, redeemed_at, revoked").order("created_at", { ascending: false }).limit(3000);
  if (error) return <p className="sheet p-6 text-center text-ink-soft">{t("launch.runSetup")}</p>;

  const batches = new Map<string, Batch>();
  for (const row of data ?? []) {
    const batch: Batch = batches.get(row.label) ?? { label: row.label, days: row.days, total: 0, used: 0, revoked: 0, unused: [] };
    batch.total += 1;
    if (row.redeemed_at) batch.used += 1;
    else if (row.revoked) batch.revoked += 1;
    else batch.unused.push(formatCode(row.code));
    batches.set(row.label, batch);
  }
  return <AdminCodes batches={[...batches.values()]} />;
}
