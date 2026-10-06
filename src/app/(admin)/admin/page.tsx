import { AdminSettingsForm } from "@/components/admin-settings-form";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { lastDays, requestsPerDay, summarizeUsage, type UsageRow } from "@/features/admin/stats";
import { toDateKey } from "@/features/gamification/streak";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const settings = await loadSettings();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 86_400_000);

  const [usage, errors, students, accounts, words] = await Promise.all([
    db
      .from("ai_usage")
      .select("feature, ok, latency_ms, created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .limit(20000),
    db
      .from("ai_usage")
      .select("feature, error, created_at")
      .eq("ok", false)
      .order("created_at", { ascending: false })
      .limit(8),
    db.from("daily_progress").select("user_id", { count: "exact", head: true }).eq("day", toDateKey(now)),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("words").select("id", { count: "exact", head: true }),
  ]);

  const rows = (usage.data ?? []) as UsageRow[];
  const today = summarizeUsage(rows.filter((row) => row.created_at >= startOfToday.toISOString()));
  const perDay = requestsPerDay(rows, lastDays(7, now));
  const peak = Math.max(1, ...perDay.map((item) => item.count));
  const keyOk = Boolean(process.env.GEMINI_API_KEY);

  return (
    <div className="space-y-12">
      <section aria-labelledby="today-heading" className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 id="today-heading" className="mb-4 text-lg font-semibold">
            {t("admin.today")}
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
            <Stat label={t("admin.requests")} value={String(today.total)} big />
            <Stat label={t("admin.errors")} value={String(today.failed)} warn={today.failed > 0} />
            <Stat
              label={t("admin.successRate")}
              value={today.successRate === null ? "—" : `${Math.round(today.successRate * 100)}%`}
            />
            <Stat
              label={t("admin.latency")}
              value={today.averageLatencyMs === null ? "—" : `${(today.averageLatencyMs / 1000).toFixed(1)}s`}
            />
            <Stat label={t("admin.students")} value={String(students.count ?? 0)} />
            <Stat label={t("admin.totalStudents")} value={String(accounts.count ?? 0)} />
            <Stat label={t("admin.totalWords")} value={String(words.count ?? 0)} />
          </dl>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-semibold">{t("admin.byFeature")}</h3>
            <ul className="space-y-1 text-ink-soft">
              <li>
                {t("admin.feature.extract")}: <b className="text-ink">{today.byFeature.extract}</b>
              </li>
              <li>
                {t("admin.feature.cards")}: <b className="text-ink">{today.byFeature.cards}</b>
              </li>
              <li>
                {t("admin.feature.tutor")}: <b className="text-ink">{today.byFeature.tutor}</b>
              </li>
            </ul>
          </div>
          <p>
            {t("admin.keyStatus")}:{" "}
            <span className={keyOk ? "text-leaf" : "text-pen-red"}>
              {keyOk ? t("admin.keyOk") : t("admin.keyMissing")}
            </span>
          </p>
        </div>
      </section>

      <section aria-labelledby="week-heading">
        <h2 id="week-heading" className="mb-4 text-lg font-semibold">
          {t("admin.last7")}
        </h2>
        <ul className="flex h-36 items-end gap-3" aria-label={t("admin.last7")}>
          {perDay.map((item) => (
            <li key={item.day} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-sm">{item.count}</span>
              <span
                className="w-full rounded-t-sm bg-marker"
                style={{ height: `${Math.max(4, (item.count / peak) * 96)}px` }}
              />
              <span className="ltr-text text-xs text-ink-faint">{item.day.slice(5)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="errors-heading">
        <h2 id="errors-heading" className="mb-3 text-lg font-semibold">
          {t("admin.recentErrors")}
        </h2>
        {(errors.data ?? []).length === 0 ? (
          <p className="text-ink-soft">{t("admin.noErrors")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(errors.data ?? []).map((item, index) => (
              <li key={index} className="ltr-text border-b border-line pb-2">
                <span className="text-ink-faint">{item.created_at.slice(0, 16).replace("T", " ")}</span> ·{" "}
                {item.feature} · <span className="text-pen-red">{item.error}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="settings-heading">
        <h2 id="settings-heading" className="mb-5 text-lg font-semibold">
          {t("admin.settings")}
        </h2>
        <AdminSettingsForm initial={settings} />
      </section>
    </div>
  );
}

function Stat({ label, value, big, warn }: { label: string; value: string; big?: boolean; warn?: boolean }) {
  return (
    <div className={big ? "col-span-2" : ""}>
      <dt className="text-sm text-ink-faint">{label}</dt>
      <dd className={`${big ? "text-4xl" : "text-2xl"} font-semibold ${warn ? "text-pen-red" : ""}`}>{value}</dd>
    </div>
  );
}
