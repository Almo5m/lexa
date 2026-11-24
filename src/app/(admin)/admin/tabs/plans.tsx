import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { MemberActions, PlanLimitsForm } from "@/components/admin-plans";
import { daysLeft } from "@/features/plus/plan";
import { countMembers, memberState, planTable } from "@/features/plus/plans";
import type { DictKey } from "@/lib/i18n/dictionary";

const SHOWN = 60;

/** The plans (what each gives), the subscribers, and the buttons to extend or end a subscription. */
export async function PlansTab() {
  const { t } = await getT();
  const settings = await loadSettings();
  const db = createSupabaseAdminClient();

  const [members, totalStudents] = await Promise.all([
    db.from("memberships").select("user_id, plus_until").order("plus_until", { ascending: true }).limit(2000),
    db.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  if (members.error) return <p className="sheet p-6 text-center text-ink-soft">{t("launch.runSetup")}</p>;

  const rows = members.data ?? [];
  const counts = countMembers(rows);
  const free = Math.max((totalStudents.count ?? 0) - counts.active - counts.expiring, 0);

  // Newest endings first among the ones still relevant; show names (and emails, to the admin only) for the visible part.
  const shown = [...rows].sort((a, b) => b.plus_until.localeCompare(a.plus_until)).slice(0, SHOWN);
  const ids = shown.map((row) => row.user_id);
  const [profiles, emails] = await Promise.all([
    ids.length ? db.from("profiles").select("id, display_name").in("id", ids) : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
    Promise.all(ids.map(async (id) => [id, (await db.auth.admin.getUserById(id)).data.user?.email ?? "—"] as const)),
  ]);
  const nameOf = new Map((profiles.data ?? []).map((p) => [p.id, p.display_name]));
  const emailOf = new Map(emails);
  const table = planTable(settings);

  const stat = (label: string, value: number, tone = "") => (
    <div className="sheet space-y-1 rounded-3xl p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t("admin.tab.plans")}>
        {stat(t("plans.statFree"), free)}
        {stat(t("plans.state.active"), counts.active, "text-leaf")}
        {stat(t("plans.state.expiring"), counts.expiring, counts.expiring > 0 ? "text-amber" : "")}
        {stat(t("plans.state.expired"), counts.expired, "text-ink-faint")}
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label={t("plans.compare")}>
        {table.map((plan) => (
          <article key={plan.id} className={`sheet space-y-3 rounded-[28px] p-5 ${plan.id === "plus" ? "ring-2 ring-xp" : ""}`}>
            <h2 className="text-lg font-bold">{t(`plans.name.${plan.id}` as DictKey)}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t("plans.aiPerDay")}</dt><dd className="font-semibold">{plan.aiPerDay}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t("plans.chatPerDay")}</dt><dd className="font-semibold">{plan.chatPerDay}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t("plans.chatPerConversation")}</dt><dd className="font-semibold">{plan.chatPerConversation}</dd></div>
              {plan.id === "plus" && <div className="flex justify-between gap-3"><dt className="text-ink-soft">{t("plans.price")}</dt><dd className="font-semibold">{settings.plusPrice || "—"}</dd></div>}
            </dl>
          </article>
        ))}
      </section>

      <PlanLimitsForm settings={settings} />

      <section className="space-y-3" aria-labelledby="members-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="members-title" className="text-lg font-bold">{t("plans.members")}</h2>
          <Link href="/admin?tab=students" className="text-sm font-medium text-indigo">{t("plans.findStudent")}</Link>
        </div>
        {shown.length === 0 && <p className="sheet p-6 text-center text-ink-soft">{t("plans.noMembers")}</p>}
        <ul className="space-y-2">
          {shown.map((row) => {
            const state = memberState(row.plus_until);
            return (
              <li key={row.user_id} className="sheet flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{nameOf.get(row.user_id) || "—"}</span>
                  <span className="ltr-text block truncate text-sm text-ink-soft">{emailOf.get(row.user_id)}</span>
                  <span className={`text-sm ${state === "active" ? "text-leaf" : state === "expiring" ? "text-amber" : "text-ink-faint"}`}>
                    {t(`plans.state.${state}` as DictKey)}
                    {state !== "expired" ? ` · ${t("plans.daysLeft", { n: daysLeft(row.plus_until) })}` : ""}
                  </span>
                </span>
                <MemberActions id={row.user_id} active={state !== "expired"} />
              </li>
            );
          })}
        </ul>
        {rows.length > SHOWN && <p className="text-sm text-ink-faint">{t("plans.showing", { a: SHOWN, b: rows.length })}</p>}
      </section>
    </div>
  );
}
