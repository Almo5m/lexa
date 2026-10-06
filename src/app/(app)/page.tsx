import Link from "next/link";
import { FlameIcon, WeakWordIcon, XpIcon } from "@/components/icons";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { levelProgress } from "@/features/gamification/xp";
import { toDateKey } from "@/features/gamification/streak";
import { statusOf, type WordRow } from "@/lib/words";

export default async function HomePage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();
  const today = toDateKey(new Date());

  const [{ data: profile }, { data: wordsData }, { data: day }] = await Promise.all([
    supabase.from("profiles").select("display_name, total_xp, streak_current, streak_last_date, streak_freezes").eq("id", user.id).single(),
    supabase.from("words").select("id, term, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id"),
    supabase.from("daily_progress").select("new_words, reviews, goal_reached").eq("user_id", user.id).eq("day", today).maybeSingle(),
  ]);

  const words = (wordsData ?? []) as unknown as WordRow[];
  const now = Date.now();
  const due = words.filter((w) => w.last_reviewed_at !== null && new Date(w.due_at).getTime() <= now).length;
  const unlearned = words.filter((w) => w.last_reviewed_at === null && w.card_status === "ready").length;
  const weak = words.filter((w) => statusOf(w, settings) === "weak").length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const streakAlive = profile?.streak_last_date === today || (profile?.streak_current ?? 0) > 0;
  const name = profile?.display_name || "";
  const newToday = day?.new_words ?? 0;
  const reviewsToday = day?.reviews ?? 0;

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("home.greeting", { name })}</h1>
        <div
          className="flex items-center gap-2 text-ink"
          aria-label={profile?.streak_current ? t("home.streak", { n: profile.streak_current }) : t("home.streakZero")}
        >
          <FlameIcon active={streakAlive && (profile?.streak_current ?? 0) > 0} width={28} height={28} />
          <span className="font-semibold">{profile?.streak_current ?? 0}</span>
        </div>
      </header>

      <section aria-labelledby="today-title" className="sheet px-6 py-7 md:px-10">
        <p id="today-title" className="text-xl leading-9">
          {due > 0 ? (
            <span className="marker px-1">{t("home.due", { n: due })}</span>
          ) : (
            t("home.nothingDue")
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {due > 0 || unlearned > 0 ? (
            <Link href="/review" className="tag-btn">
              {t("home.start")}
            </Link>
          ) : null}
          <Link href="/add" className={`tag-btn ${due > 0 ? "tag-btn-quiet" : ""}`}>
            {t("home.add")}
          </Link>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="goal-title">
          <h2 id="goal-title" className="mb-3 text-lg font-semibold">
            {t("home.goalTitle")}
          </h2>
          <ul className="space-y-3">
            <GoalLine
              label={t("home.goalWords", { a: Math.min(newToday, settings.dailyGoalNewWords), b: settings.dailyGoalNewWords })}
              ratio={newToday / settings.dailyGoalNewWords}
            />
            <GoalLine
              label={t("home.goalReviews", { a: Math.min(reviewsToday, settings.dailyGoalReviews), b: settings.dailyGoalReviews })}
              ratio={reviewsToday / settings.dailyGoalReviews}
            />
          </ul>
          {day?.goal_reached && <p className="mt-3 font-medium text-leaf">{t("home.goalDone")}</p>}
        </section>

        <section aria-label={t("home.level", { n: progress.level })} className="space-y-4">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <XpIcon />
              {t("home.level", { n: progress.level })}
            </p>
            <div className="mt-2 h-2 rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={progress.neededXp} aria-valuenow={progress.currentXp}>
              <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.round(progress.ratio * 100)}%` }} />
            </div>
            <p className="mt-1 text-sm text-ink-faint">
              {t("home.xpToNext", { n: progress.neededXp - progress.currentXp })}
            </p>
          </div>
          {weak > 0 && (
            <Link href="/words?filter=weak" className="flex min-h-12 items-center gap-3 rounded-md px-1 text-pen-red underline-offset-4 hover:underline">
              <WeakWordIcon />
              <span>
                {t("home.weak", { n: weak })} · {t("home.weakAction")}
              </span>
            </Link>
          )}
          <p className="text-sm text-ink-faint">{t("home.freezes", { n: profile?.streak_freezes ?? 0 })}</p>
        </section>
      </div>
    </div>
  );
}

function GoalLine({ label, ratio }: { label: string; ratio: number }) {
  const percent = Math.round(Math.min(1, ratio) * 100);
  return (
    <li>
      <p className="text-sm">{label}</p>
      <div className="mt-1 h-2 rounded-full bg-paper-deep">
        <div className="h-2 rounded-full bg-marker-deep" style={{ width: `${percent}%` }} />
      </div>
    </li>
  );
}
