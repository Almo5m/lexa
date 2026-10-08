import Link from "next/link";
import { AdminAiPanel } from "@/components/admin-ai-panel";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  lastDays,
  okAndFailedPerDay,
  parseStoredError,
  summarizeByFeature,
  summarizeUsage,
  type UsageRow,
} from "@/features/admin/stats";
import { toDateKey } from "@/features/gamification/streak";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const TABS = ["overview", "ai", "settings"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "overview";
  const { t } = await getT();
  const settings = await loadSettings();

  return (
    <div className="space-y-6">
      <nav aria-label={t("admin.title")} className="flex gap-1 overflow-x-auto rounded-full bg-sheet p-1 shadow-[var(--shadow-1)]">
        {TABS.map((item) => (
          <Link
            key={item}
            href={item === "overview" ? "/admin" : `/admin?tab=${item}`}
            aria-current={tab === item ? "page" : undefined}
            className={`inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold ${
              tab === item ? "bg-[image:var(--grad)] text-white" : "text-ink-soft hover:bg-paper-deep"
            }`}
          >
            {t(`admin.tab.${item}` as DictKey)}
          </Link>
        ))}
      </nav>

      {tab === "overview" && <Overview />}
      {tab === "ai" && <AdminAiPanel settings={settings} keySet={Boolean(process.env.GEMINI_API_KEY)} />}
      {tab === "settings" && <AdminSettingsForm initial={settings} />}
    </div>
  );
}

async function Overview() {
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 86_400_000);

  const [usage, errors, students, accounts, words] = await Promise.all([
    db.from("ai_usage").select("feature, ok, latency_ms, created_at").gte("created_at", sevenDaysAgo.toISOString()).limit(20000),
    db.from("ai_usage").select("feature, error, created_at").eq("ok", false).order("created_at", { ascending: false }).limit(8),
    db.from("daily_progress").select("user_id", { count: "exact", head: true }).eq("day", toDateKey(now)),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("words").select("id", { count: "exact", head: true }),
  ]);

  const rows = (usage.data ?? []) as UsageRow[];
  const today = summarizeUsage(rows.filter((row) => row.created_at >= startOfToday.toISOString()));
  const perDay = okAndFailedPerDay(rows, lastDays(7, now));
  const peak = Math.max(1, ...perDay.map((item) => item.ok + item.failed));
  const byFeature = summarizeByFeature(rows);
  const struggling = today.total >= 3 && today.successRate !== null && today.successRate < 0.8;

  return (
    <div className="space-y-6">
      {struggling && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] border-s-4 border-pen-red bg-pen-red/10 p-4">
          <p className="font-semibold text-pen-red">
            {t("admin.errors")}: {today.failed} / {today.total}
          </p>
          <Link href="/admin?tab=ai" className="inline-flex min-h-11 items-center rounded-full bg-pen-red px-5 font-semibold text-[#1a1066]">
            {t("admin.tab.ai")}
          </Link>
        </div>
      )}

      <section aria-label={t("admin.today")} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={t("admin.requests")} value={String(today.total)} />
        <Kpi
          label={t("admin.successRate")}
          value={today.successRate === null ? "—" : `${Math.round(today.successRate * 100)}%`}
          tone={today.successRate === null ? undefined : today.successRate >= 0.9 ? "good" : today.successRate >= 0.7 ? "warn" : "bad"}
        />
        <Kpi label={t("admin.latency")} value={today.averageLatencyMs === null ? "—" : `${(today.averageLatencyMs / 1000).toFixed(1)}s`} />
        <Kpi label={t("admin.students")} value={String(students.count ?? 0)} />
      </section>

      <section aria-labelledby="chart-title" className="sheet p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="chart-title" className="text-lg font-bold">
            {t("admin.chart.title")}
          </h2>
          <p className="flex gap-4 text-sm text-ink-soft">
            <Legend color="bg-[image:var(--grad)]" label={t("admin.chart.ok")} />
            <Legend color="bg-pen-red" label={t("admin.chart.failed")} />
          </p>
        </div>
        <ul className="flex h-44 items-end gap-3" aria-label={t("admin.chart.title")}>
          {perDay.map((item) => {
            const total = item.ok + item.failed;
            const height = total === 0 ? 4 : Math.max(8, (total / peak) * 128);
            return (
              <li key={item.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${item.day}: ${item.ok} / ${item.failed}`}>
                <span className="text-sm font-semibold">{total}</span>
                <span className="flex w-full max-w-14 flex-col overflow-hidden rounded-t-lg" style={{ height }}>
                  {item.failed > 0 && <span className="bg-pen-red" style={{ flex: item.failed }} />}
                  <span className="bg-[image:var(--grad)]" style={{ flex: Math.max(item.ok, total === 0 ? 1 : 0) }} />
                </span>
                <span className="ltr-text text-xs text-ink-faint">{item.day.slice(5)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="feature-title" className="sheet p-6">
          <h2 id="feature-title" className="mb-3 text-lg font-bold">
            {t("admin.byFeature")} · {t("admin.last7")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="text-sm text-ink-faint">
                <tr>
                  <th scope="col" className="py-2 text-start font-medium">{t("admin.table.feature")}</th>
                  <th scope="col" className="py-2 text-start font-medium">{t("admin.table.requests")}</th>
                  <th scope="col" className="py-2 text-start font-medium">{t("admin.table.failed")}</th>
                  <th scope="col" className="py-2 text-start font-medium">{t("admin.table.latency")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byFeature.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row" className="py-3 text-start font-medium">{t(`admin.feature.${row.feature}` as DictKey)}</th>
                    <td className="py-3">{row.total}</td>
                    <td className={`py-3 ${row.failed > 0 ? "font-semibold text-pen-red" : ""}`}>{row.failed}</td>
                    <td className="py-3">{row.averageLatencyMs === null ? "—" : `${(row.averageLatencyMs / 1000).toFixed(1)}s`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-label="Totals" className="sheet grid grid-cols-2 content-start gap-4 p-6">
          <MiniStat label={t("admin.totalStudents")} value={accounts.count ?? 0} />
          <MiniStat label={t("admin.totalWords")} value={words.count ?? 0} />
        </section>
      </div>

      <section aria-labelledby="errors-title" className="sheet p-6">
        <h2 id="errors-title" className="mb-3 text-lg font-bold">
          {t("admin.recentErrors")}
        </h2>
        {(errors.data ?? []).length === 0 ? (
          <p className="text-leaf">{t("admin.errorsEmpty")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {(errors.data ?? []).map((item, index) => {
              const parsed = parseStoredError(item.error);
              const known = ["busy", "quota", "model", "auth", "other"].includes(parsed.kind) ? parsed.kind : "other";
              const serious = known === "model" || known === "auth";
              return (
                <li key={index} className="space-y-1 py-3">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        serious ? "bg-pen-red/20 text-pen-red" : known === "other" ? "bg-line text-ink-soft" : "bg-amber/20 text-amber"
                      }`}
                    >
                      {t(`admin.kind.${known}` as DictKey)}
                    </span>
                    <span className="text-ink-soft">{t(`admin.feature.${item.feature}` as DictKey)}</span>
                    <span className="ltr-text text-ink-faint">{item.created_at.slice(0, 16).replace("T", " ")}</span>
                  </p>
                  <p className="text-sm text-ink-soft">{t(`admin.kindHelp.${known}` as DictKey)}</p>
                  <p className="ltr-text break-words text-xs text-ink-faint">{parsed.message}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-leaf" : tone === "warn" ? "text-amber" : tone === "bad" ? "text-pen-red" : "";
  return (
    <div className="sheet p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--r-sm)] bg-paper-deep/60 p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
