import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { GrantPlus } from "@/components/admin-grant-plus";
import { loadPlusUntil } from "@/features/plus/server";
import { daysLeft } from "@/features/plus/plan";
import { DeleteStudent } from "@/components/admin-delete-student";
import { lastActiveByUser, safeLike } from "@/features/admin/growth";
import { levelFromXp } from "@/features/gamification/xp";

const PAGE_SIZE = 25;
const ID_PATTERN = /^[0-9a-f-]{36}$/;

interface Props {
  q?: string;
  page?: string;
  id?: string;
}

/** The students: search, who studied lately, and one student's numbers. Emails show here only, to the admin. */
export async function StudentsTab({ q, page, id }: Props) {
  if (id && ID_PATTERN.test(id)) return <StudentDetail id={id} />;
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const term = safeLike(q ?? "");
  const pageNumber = Math.max(0, Number.parseInt(page ?? "0", 10) || 0);

  let query = db.from("profiles").select("id, display_name, total_xp, streak_current, created_at, role", { count: "exact" }).order("created_at", { ascending: false }).range(pageNumber * PAGE_SIZE, pageNumber * PAGE_SIZE + PAGE_SIZE - 1);
  if (term) query = query.ilike("display_name", `%${term}%`);
  const { data, count } = await query;
  const rows = data ?? [];

  const ids = rows.map((row) => row.id);
  const [activity, emails] = await Promise.all([
    ids.length ? db.from("daily_progress").select("user_id, day").in("user_id", ids).order("day", { ascending: false }).limit(5000) : Promise.resolve({ data: [] as { user_id: string; day: string }[] }),
    Promise.all(ids.map(async (userId) => [userId, (await db.auth.admin.getUserById(userId)).data.user?.email ?? "—"] as const)),
  ]);
  const last = lastActiveByUser(activity.data ?? []);
  const emailOf = new Map(emails);
  const total = count ?? 0;
  const hasNext = (pageNumber + 1) * PAGE_SIZE < total;
  const link = (p: number) => `/admin?tab=students&page=${p}${term ? `&q=${encodeURIComponent(term)}` : ""}`;

  return (
    <div className="space-y-4">
      <form action="/admin" className="flex flex-wrap gap-2">
        <input type="hidden" name="tab" value="students" />
        <input name="q" defaultValue={term} maxLength={40} className="field max-w-sm" placeholder={t("students.search")} aria-label={t("students.search")} />
        <button type="submit" className="tag-btn tag-btn-grad">{t("students.searchButton")}</button>
      </form>
      <p className="text-sm text-ink-soft">{t("students.count", { n: total })}</p>

      {rows.length === 0 && <p className="sheet p-6 text-center text-ink-soft">{t("students.none")}</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/admin?tab=students&id=${row.id}`} className="sheet grid min-h-16 gap-1 px-4 py-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center sm:gap-4">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{row.display_name || "—"}{row.role === "admin" ? ` · ${t("students.admin")}` : ""}</span>
                <span className="ltr-text block truncate text-sm text-ink-soft">{emailOf.get(row.id)}</span>
              </span>
              <span className="text-sm text-ink-soft">
                {t("students.lastActive")}: <span className="ltr-text">{last.get(row.id) ?? t("students.never")}</span>
              </span>
              <span className="ltr-text text-sm font-semibold text-indigo">Lv {levelFromXp(row.total_xp)} · {row.total_xp} XP · 🔥{row.streak_current}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-between gap-3">
        {pageNumber > 0 ? <Link href={link(pageNumber - 1)} className="tag-btn tag-btn-quiet">{t("students.prev")}</Link> : <span />}
        {hasNext && <Link href={link(pageNumber + 1)} className="tag-btn tag-btn-quiet">{t("students.next")}</Link>}
      </div>
    </div>
  );
}

async function StudentDetail({ id }: { id: string }) {
  const { t } = await getT();
  const db = createSupabaseAdminClient();
  const { data: profile } = await db.from("profiles").select("display_name, total_xp, streak_current, streak_longest, level_band, created_at, role, onboarded").eq("id", id).maybeSingle();
  if (!profile) return <p className="sheet p-6 text-center text-ink-soft">{t("students.none")}</p>;

  const head = (table: string) => db.from(table).select("*", { count: "exact", head: true }).eq("user_id", id);
  const [email, words, reviews, challenges, talks, week, plusUntil] = await Promise.all([
    db.auth.admin.getUserById(id),
    head("words"),
    head("review_logs"),
    head("challenge_results"),
    head("talk_sessions"),
    db.from("daily_progress").select("day, xp, reviews, new_words").eq("user_id", id).order("day", { ascending: false }).limit(7),
    loadPlusUntil(db, id),
  ]);

  const stats: [string, string][] = [
    [t("students.level"), `Lv ${levelFromXp(profile.total_xp)} · ${profile.total_xp} XP`],
    [t("students.streak"), `${profile.streak_current} / ${profile.streak_longest}`],
    [t("students.band"), profile.level_band ? String(profile.level_band) : t("students.never")],
    [t("students.words"), String(words.count ?? 0)],
    [t("students.reviews"), String(reviews.count ?? 0)],
    [t("students.challenges"), String(challenges.count ?? 0)],
    [t("students.talks"), String(talks.count ?? 0)],
    [t("students.joined"), profile.created_at.slice(0, 10)],
    ["Plus", daysLeft(plusUntil) > 0 ? t("students.plusDays", { n: daysLeft(plusUntil) }) : "—"],
  ];

  return (
    <div className="space-y-4">
      <Link href="/admin?tab=students" className="inline-flex min-h-11 items-center text-ink-soft transition-colors hover:text-indigo">‹ {t("students.back")}</Link>
      <section className="sheet space-y-4 p-6">
        <div>
          <h2 className="text-xl font-bold">{profile.display_name || "—"}</h2>
          <p className="ltr-text text-sm text-ink-soft">{email.data.user?.email ?? "—"}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-[var(--r-md)] bg-paper-deep p-3">
              <dt className="text-xs text-ink-soft">{label}</dt>
              <dd className="ltr-text font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <div>
          <h3 className="mb-2 font-semibold">{t("students.week")}</h3>
          {(week.data ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft">{t("students.noWeek")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(week.data ?? []).map((day) => (
                <li key={day.day} className="ltr-text flex justify-between gap-3">
                  <span>{day.day}</span>
                  <span>{day.xp} XP · {day.new_words} new · {day.reviews} reviews</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <GrantPlus id={id} />
      {profile.role !== "admin" && <DeleteStudent id={id} />}
    </div>
  );
}
