import Link from "next/link";
import type { ReactNode } from "react";
import { GoalRing } from "@/components/goal-ring";
import { LexaIcon, PracticeIcon, WeakWordIcon, WordsIcon, XpIcon } from "@/components/icons";
import { LexaMascot } from "@/components/lexa-mascot";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings-server";
import { levelProgress } from "@/features/gamification/xp";
import { toDateKey } from "@/features/gamification/streak";
import { statusOf, type WordRow } from "@/lib/words";
import { MinutesPicker } from "@/components/minutes-picker";
import { PATH_SIZE, UNITS, nextPathWords, unitById } from "@/features/curriculum";
import { currentUnit, unitProgress, type WordState } from "@/features/curriculum/progress";
import { QUESTION_COUNT } from "@/features/reading/schemas";
import { readingMeter, speakMeter, translateMeter, wordsMeter } from "@/features/skills/meters";
import { SkillMeters } from "@/components/skill-meters";
import type { StoredSession } from "@/features/talk/analyze";
import { isDailyMinutes, newWordsQuota } from "@/features/curriculum/session-plan";

export default async function HomePage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();
  const today = toDateKey(new Date());

  const dayStart = `${today}T00:00:00Z`;
  const [{ data: profile }, { data: wordsData }, { data: day }, { count: translatedToday }, { count: spokeToday }, { data: readToday }, { data: translateLogs }, { data: readingRows }, { data: talkRows }] = await Promise.all([
    supabase.from("profiles").select("display_name, total_xp, level_band, onboarded, daily_minutes").eq("id", user.id).single(),
    supabase.from("words").select("id, term, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id, source"),
    supabase.from("daily_progress").select("new_words, reviews, xp, goal_reached").eq("user_id", user.id).eq("day", today).maybeSingle(),
    supabase.from("review_logs").select("id", { count: "exact", head: true }).eq("mode", "translate").gte("created_at", dayStart),
    supabase.from("talk_sessions").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
    createSupabaseAdminClient().from("reading_sessions").select("completed_at").eq("user_id", user.id).eq("day", today).maybeSingle(),
    supabase.from("review_logs").select("grade").eq("mode", "translate").order("created_at", { ascending: false }).limit(20),
    createSupabaseAdminClient().from("reading_sessions").select("answers").eq("user_id", user.id).not("completed_at", "is", null).order("day", { ascending: false }).limit(10),
    supabase.from("talk_sessions").select("vocabulary_level, grammar_level, clarity_level, mistakes, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const words = (wordsData ?? []) as unknown as WordRow[];
  const now = Date.now();
  const due = words.filter((w) => w.last_reviewed_at !== null && new Date(w.due_at).getTime() <= now).length;
  const weak = words.filter((w) => statusOf(w, settings) === "weak").length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const goalDone = day?.goal_reached ?? false;

  const minutes = isDailyMinutes(profile?.daily_minutes) ? profile.daily_minutes : 15;
  const quota = newWordsQuota(settings.dailyGoalNewWords, minutes);
  const waiting = words.filter((w) => w.source === "path" && w.last_reviewed_at === null).length;
  const learnLeft = Math.max(quota - (day?.new_words ?? 0), waiting);
  const nextWord = nextPathWords(new Set(words.map((w) => w.term)), 1)[0];
  const pathEnded = !nextWord && waiting === 0;
  const unitName = unitById(nextWord?.unitId ?? "")?.titleAr ?? "";

  const steps: Step[] = [
    { key: "review", href: "/review", title: t("today.stepReview"), done: due === 0, hint: due === 0 ? t("today.stepReviewDone") : t("today.stepReviewHint", { n: due }) },
    {
      key: "learn",
      href: "/learn",
      title: t("today.stepLearn"),
      done: learnLeft === 0 || pathEnded,
      hint: pathEnded ? t("today.stepLearnEnd") : learnLeft === 0 ? t("today.stepLearnDone") : t("today.stepLearnHint", { n: learnLeft, unit: unitName }),
    },
    { key: "read", href: "/read", title: t("today.stepRead"), done: Boolean(readToday?.completed_at), hint: readToday?.completed_at ? t("today.stepReadDone") : t("today.stepReadHint") },
    { key: "translate", href: "/translate?today=1", title: t("today.stepTranslate"), done: (translatedToday ?? 0) > 0, hint: (translatedToday ?? 0) > 0 ? t("today.stepTranslateDone") : t("today.stepTranslateHint") },
    { key: "speak", href: "/talk?today=1", title: t("today.stepSpeak"), done: (spokeToday ?? 0) > 0, hint: (spokeToday ?? 0) > 0 ? t("today.stepSpeakDone") : t("today.stepSpeakHint") },
  ];
  const firstOpen = steps.find((step) => !step.done);

  const pathStates = new Map<string, WordState>(
    words.filter((w) => w.source === "path").map((w) => [w.term, { learned: w.last_reviewed_at !== null, repetitions: w.repetitions }]),
  );
  const unitsProgress = UNITS.map((unit) => unitProgress(unit, pathStates));
  const current = currentUnit(unitsProgress);
  const learnedCount = [...pathStates.values()].filter((state) => state.learned).length;
  const meters = [
    { key: "words", label: t("skills.words"), hint: t("skills.wordsHint"), ...wordsMeter(learnedCount, PATH_SIZE) },
    { key: "read", label: t("skills.read"), hint: t("skills.readHint"), ...readingMeter((readingRows ?? []).map((row) => ({ answers: row.answers as { correct: boolean }[] | null, questions: QUESTION_COUNT }))) },
    { key: "translate", label: t("skills.translate"), hint: t("skills.translateHint"), ...translateMeter((translateLogs ?? []).map((row) => row.grade)) },
    { key: "speak", label: t("skills.speak"), hint: t("skills.speakHint"), ...speakMeter((talkRows ?? []) as unknown as StoredSession[]) },
  ];

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

      <section className="hero-card space-y-5 p-6" aria-labelledby="focus-title">
        <div>
          <h1 id="focus-title" className="text-xl font-semibold">
            {t("today.title")}
          </h1>
          <p className="mt-1 opacity-85">{firstOpen ? t("today.hint") : t("today.allDone")}</p>
        </div>
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={step.key}>
              <Link
                href={step.href}
                className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 ${
                  step === firstOpen ? "bg-white text-indigo shadow-[var(--shadow-1)]" : "bg-white/12 text-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step.done ? "bg-leaf text-white" : step === firstOpen ? "bg-indigo text-white" : "bg-white/20"
                  }`}
                >
                  {step.done ? "✓" : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{step.title}</span>
                  <span className={`block text-sm ${step === firstOpen ? "text-ink-soft" : "opacity-80"}`}>{step.hint}</span>
                </span>
                <span className="sr-only">{step.done ? t("today.done") : t("today.go")}</span>
              </Link>
            </li>
          ))}
        </ol>
        {firstOpen ? (
          <Link href={firstOpen.href} className="tag-btn w-full justify-center sm:w-auto">
            {t("today.continue")}
          </Link>
        ) : (
          !pathEnded && (
            <Link href="/learn?more=1" className="tag-btn w-full justify-center sm:w-auto">
              {t("today.moreWords")}
            </Link>
          )
        )}
        <MinutesPicker initial={minutes} />
      </section>

      {profile && !profile.onboarded && (
        <section className="sheet flex flex-wrap items-center justify-between gap-3 p-5" aria-label={t("me.title")}>
          <p className="flex-1 font-medium">{t("me.banner")}</p>
          <Link href="/me" className="tag-btn tag-btn-grad">
            {t("me.bannerButton")}
          </Link>
        </section>
      )}

      {profile?.level_band == null && (
        <Link href="/level" className="sheet flex min-h-14 items-center gap-3 px-5 font-medium text-indigo">
          <XpIcon />
          {t("home.findLevel")}
        </Link>
      )}

      <SkillMeters meters={meters} title={t("skills.title")} emptyText={t("skills.empty")} />

      <Link href="/path" className="sheet flex min-h-16 items-center justify-between gap-3 px-5 py-3">
        <span>
          <span className="block font-semibold">{t("path.mapTitle")}</span>
          <span className="block text-sm text-ink-soft">
            {current ? t("path.mapCurrent", { name: unitById(current.unitId)?.titleAr ?? "" }) : t("path.mapDone")}
          </span>
        </span>
        <span className="text-sm font-medium text-indigo">{t("path.mapLink")}</span>
      </Link>

      <section aria-labelledby="goal-title">
        <h2 id="goal-title" className="mb-3 text-lg font-bold">
          {t("home.goalTitle")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <GoalRing done={day?.new_words ?? 0} goal={quota} label={t("home.ringWords")} />
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
          {t("today.extra")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Tile href="/add" tone="bg-[#e9e4ff] text-indigo" icon={<PracticeIcon />} title={t("nav.add")} hint={t("home.add")} />
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

interface Step {
  key: string;
  href: string;
  title: string;
  hint: string;
  done: boolean;
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
