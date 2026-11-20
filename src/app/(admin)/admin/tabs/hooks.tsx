import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { HookActions } from "@/components/admin-hook-actions";
import type { DictKey } from "@/lib/i18n/dictionary";

/** Memory hooks students sent. Pending ones come first. The credit line shows exactly what the student chose. */
export async function HooksTab() {
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("shared_hooks").select("id, term, hook, author_name, status, created_at").order("status", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  if (error) return <p className="sheet p-6 text-center text-ink-soft">{t("launch.runSetup")}</p>;
  const rows = [...(data ?? [])].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  const pending = rows.filter((row) => row.status === "pending").length;

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">{t("hooks.admin.intro", { n: pending })}</p>
      {rows.length === 0 && <p className="sheet p-6 text-center text-ink-soft">{t("hooks.admin.empty")}</p>}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className={`sheet space-y-2 p-5 ${row.status === "pending" ? "" : "opacity-70"}`}>
            <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
              <span className="ltr-text text-lg font-semibold text-ink">{row.term}</span>
              <span>{t(`hooks.status.${row.status}` as DictKey)} · {row.author_name ? t("hooks.admin.by", { name: row.author_name }) : t("hooks.admin.anon")}</span>
            </p>
            <p className="whitespace-pre-wrap break-words">{row.hook}</p>
            <HookActions id={row.id} status={row.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
