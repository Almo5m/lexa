import Link from "next/link";
import type { ReactNode } from "react";
import { GoalRing } from "@/components/goal-ring";
import { LexaIcon, PracticeIcon, WeakWordIcon, WordsIcon, XpIcon } from "@/components/icons";
import { LexaMascot } from "@/components/lexa-mascot";
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
    supabase.from("profiles").select("display_name, total_xp, level_band").eq("id", user.id).single(),
    supabase.from("words").select("id, term, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id"),
    supabase.from("daily_progress").select("new_words, reviews, xp, goal_reached").eq("user_id", user.id).eq("day", today).maybeSingle(),
  ]);

  const words = (wordsData ?? []) as unknown as WordRow[];
  const now = Date.now();
  const due = words.filter((w) => w.last_reviewed_at !== null && new Date(w.due_at).getTime() <= now).length;
  const unlearned = words.filter((w) => w.last_reviewed_at === null && w.card_status === "ready").length;
  const weak = words.filter((w) => statusOf(w, settings) === "weak").length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const goalDone = day?.goal_reached ?? false;
  const canReview = due > 0 || unlearned > 0;

  return (
    <div className="max-w-2xl space-y-6">
      <section className="flex items-end gap-3" aria-label="Lexa">
        {goalDone ? (
          <LexaMascot mood="happy" size={104} className="shrink-0" />
        ) : (
          <img src="/lexa/owl.webp" alt="" width={104} height={88} className="h-auto w-[104px] shrink-0" />
        )}
        <div className="relative mb-2 rounded-[22px_22px_22px_6px] bg-sheet px-4 py-3 shadow-[var(--shadow-1)]">
          <p className="font-semibold">{t("home.greeting", { name: profile?.display_name ?? "" })}</p>
          <p className="text-ink-soft">{goalDone ? t("home.goalDone") : due > 0 ? t("home.due", { n: due }) : t("home.nothingDue")}</p>
        </div>
      </section>

      <section className="hero-card p-6" aria-labelledby="focus-title">
        <h1 id="focus-title" className="text-xl font-semibold">
          {t("home.focus")}
        </h1>
        <p className="mb-5 mt-1 opacity-85">{t("home.focusHint")}</p>
        <div className="flex flex-wrap gap-3">
          {canReview && (
            <Link href="/review" className="tag-btn">
              {t("home.start")}
            </Link>
          )}
          <Link href="/add" className="tag-btn">
            {t("home.add")}
          </Link>
        </div>
      </section>

      {profile?.level_band == null && (
        <Link href="/level" className="sheet flex min-h-14 items-center gap-3 px-5 font-medium text-indigo">
          <XpIcon />
          {t("home.findLevel")}
        </Link>
      )}

      <section aria-labelledby="goal-title">
        <h2 id="goal-title" className="mb-3 text-lg font-bold">
          {t("home.goalTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <GoalRing done={day?.new_words ?? 0} goal={settings.dailyGoalNewWords} label={t("home.ringWords")} />
          <GoalRing done={day?.reviews ?? 0} goal={settings.dailyGoalReviews} label={t("home.ringReviews")} />
          <div className="sheet flex flex-col items-center justify-center px-2 py-4 text-center">
            <XpIcon width={36} height={36} />
            <p className="mt-1 text-base font-semibold">{day?.xp ?? 0}</p>
            <p className="text-xs text-ink-soft">{t("home.xpToday")}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="continue-title">
        <h2 id="continue-title" className="mb-3 text-lg font-bold">
          {t("home.continue")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Tile href="/review" tone="bg-[#e9e4ff] text-indigo" icon={<PracticeIcon />} title={t("practice.review")} hint={t("home.tileDue", { n: due })} />
          <Tile href="/quiz" tone="bg-[#dff1ff] text-[#16507e]" icon={<WordsIcon />} title={t("practice.quiz")} hint={t("practice.quizHint")} />
          <Tile href="/translate" tone="bg-[#e4f8ff] text-[#0b5f7a]" icon={<LexaIcon />} title={t("practice.translate")} hint={t("practice.translateHint")} />
          <Tile href="/words?filter=weak" tone="bg-[#ffeedd] text-[#8a4b00]" icon={<WeakWordIcon />} title={t("words.weak")} hint={t("home.tileWeak", { n: weak })} />
        </div>
      </section>

      <section className="sheet px-5 py-4" aria-label={t("home.level", { n: progress.level })}>
        <div className="flex items-center justify-between font-semibold">
          <span>{t("home.level", { n: progress.level })}</span>
          <span className="text-sm font-normal text-ink-faint">{t("home.xpToNext", { n: progress.neededXp - progress.currentXp })}</span>
        </div>
        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-paper-deep"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.neededXp}
          aria-valuenow={progress.currentXp}
        >
          <div className="grad-fill h-3 rounded-full" style={{ width: `${Math.max(4, Math.round(progress.ratio * 100))}%` }} />
        </div>
      </section>
    </div>
  );
}

function Tile({ href, tone, icon, title, hint }: { href: string; tone: string; icon: ReactNode; title: string; hint: string }) {
  return (
    <Link href={href} className={`flex min-h-28 flex-col gap-2 rounded-[var(--r-md)] p-4 font-semibold shadow-[var(--shadow-1)] ${tone}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70">{icon}</span>
      {title}
      <span className="text-sm font-normal leading-snug opacity-80">{hint}</span>
    </Link>
  );
}
