import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { FeedbackActions } from "@/components/admin-feedback-actions";
import type { DictKey } from "@/lib/i18n/dictionary";

/** Messages students sent. The open ones come first; the sender shows by name so the admin can answer him. */
export async function FeedbackTab() {
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("feedback").select("id, user_id, kind, message, done, created_at").order("done").order("created_at", { ascending: false }).limit(100);
  if (error) return <p className="sheet p-6 text-center text-ink-soft">{t("launch.runSetup")}</p>;
  const rows = data ?? [];
  const ids = [...new Set(rows.map((row) => row.user_id))];
  const names = ids.length ? await db.from("profiles").select("id, display_name").in("id", ids) : { data: [] as { id: string; display_name: string }[] };
  const nameOf = new Map((names.data ?? []).map((row) => [row.id, row.display_name]));
  const open = rows.filter((row) => !row.done).length;

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">{t("feedback.admin.intro", { n: open })}</p>
      {rows.length === 0 && <p className="sheet p-6 text-center text-ink-soft">{t("feedback.admin.empty")}</p>}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className={`sheet space-y-2 p-5 ${row.done ? "opacity-60" : ""}`}>
            <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
              <span className="font-semibold text-ink">{nameOf.get(row.user_id) || "—"} · {t(`feedback.kind.${row.kind}` as DictKey)}</span>
              <span className="ltr-text">{row.created_at.slice(0, 16).replace("T", " ")}</span>
            </p>
            <p className="whitespace-pre-wrap break-words">{row.message}</p>
            <FeedbackActions id={row.id} done={row.done} />
          </li>
        ))}
      </ul>
    </div>
  );
}
