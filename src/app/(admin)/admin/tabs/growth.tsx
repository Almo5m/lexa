import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { activeCounts, signupsPerDay } from "@/features/admin/growth";
import { lastDays } from "@/features/admin/stats";
import { toDateKey } from "@/features/gamification/streak";

/** Who signed up and who comes back: new students per day, and how many studied today, this week and this month. */
export async function GrowthSection() {
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const now = new Date();
  const dayKeys = lastDays(7, now);
  const monthStart = toDateKey(new Date(now.getTime() - 29 * 86_400_000), "Africa/Cairo");
  const weekStart = toDateKey(new Date(now.getTime() - 6 * 86_400_000), "Africa/Cairo");
  const today = toDateKey(now, "Africa/Cairo");

  const [profiles, activity, total] = await Promise.all([
    db.from("profiles").select("created_at").gte("created_at", `${dayKeys[0]}T00:00:00Z`).limit(20000),
    db.from("daily_progress").select("user_id, day").gte("day", monthStart).limit(50000),
    db.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const signups = signupsPerDay((profiles.data ?? []).map((row) => row.created_at), dayKeys);
  const active = activeCounts(activity.data ?? [], today, weekStart, monthStart);
  const peak = Math.max(1, ...signups.map((item) => item.count));

  return (
    <>
      <section aria-label={t("growth.title")} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={t("growth.total")} value={total.count ?? 0} />
        <Kpi label={t("growth.today")} value={active.today} />
        <Kpi label={t("growth.week")} value={active.week} />
        <Kpi label={t("growth.month")} value={active.month} />
      </section>
      <section aria-labelledby="signups-title" className="sheet p-6">
        <h2 id="signups-title" className="mb-4 text-lg font-bold">{t("growth.signups")}</h2>
        <ul className="flex h-36 items-end gap-3">
          {signups.map((item) => (
            <li key={item.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${item.day}: ${item.count}`}>
              <span className="text-sm font-semibold">{item.count}</span>
              <span className="w-full max-w-14 rounded-t-lg bg-[image:var(--grad)]" style={{ height: item.count === 0 ? 4 : Math.max(8, (item.count / peak) * 90) }} />
              <span className="ltr-text text-xs text-ink-faint">{item.day.slice(5)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="sheet p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="ltr-text text-3xl font-bold">{value}</p>
    </div>
  );
}
