import Link from "next/link";
import { BoMascot } from "@/components/bo-mascot";
import { MinutesPicker } from "@/components/minutes-picker";
import { BlockCard, StatTile } from "@/components/today-blocks";
import { ChatIcon, FlameIcon, GrammarIcon, PathIcon, PracticeIcon, SparkIcon, WordsIcon, XpIcon } from "@/components/icons";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { bubbleFor } from "@/features/bo/bubble";
import { levelProgress } from "@/features/gamification/xp";
import { dailyMessage, fillName } from "@/features/bo/messages";
import { loadBoMessages } from "@/features/bo/messages-load";
import { loadWordsOfDay, wordForDay } from "@/features/wordday/load";
import { resultForDay } from "@/features/challenge/server";
import { SpeakButton } from "@/components/speak-button";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings-server";
import { toDateKey } from "@/features/gamification/streak";
import { nearestBadge } from "@/features/achievements/badges";
import { nextPathWords, startUnitIndex, unitById } from "@/features/curriculum";
import { chosenStage } from "@/features/stage/stage";
import { loadSchoolUnits, unitsForStage } from "@/features/school/load";
import { nextSchoolWords, schoolWordTotal } from "@/features/school/pick";
import { isDailyMinutes, newWordsQuota } from "@/features/curriculum/session-plan";
import { STEP_HREF, planToday, stepNumber, type PlannedStep, type StepKey } from "@/features/curriculum/today-plan";
import type { DictKey } from "@/lib/i18n/dictionary";

/**
 * Today. One job: show the four steps of today's session, the one to do now, and nothing else.
 * Progress, units and skills live on the plan page; free exercises live under practice.
 */
export default async function HomePage() {
  const { supabase, user } = await requireUserPage();
  const { t, lang } = await getT();
  const settings = await loadSettings();
  const today = toDateKey(new Date());
  const dayStart = `${today}T00:00:00Z`;

  const [{ data: profile }, { data: wordsData }, { data: day }, { count: translatedToday }, { count: spokeToday }, { data: readToday }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, level_band, onboarded, daily_minutes, streak_current, streak_longest, stage, total_xp")
        .eq("id", user.id)
        .single(),
      supabase.from("words").select("term, source, due_at, last_reviewed_at"),
      supabase.from("daily_progress").select("new_words").eq("user_id", user.id).eq("day", today).maybeSingle(),
      supabase.from("review_logs").select("id", { count: "exact", head: true }).eq("mode", "translate").gte("created_at", dayStart),
      supabase.from("talk_sessions").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
      createSupabaseAdminClient().from("reading_sessions").select("completed_at").eq("user_id", user.id).eq("day", today).maybeSingle(),
    ]);

  const boNote = dailyMessage(await loadBoMessages(supabase, lang).catch(() => []), today, user.id);
  const wordOfDay = wordForDay(await loadWordsOfDay(supabase, lang).catch(() => []), today);
  const challengeDone = await resultForDay(createSupabaseAdminClient(), user.id, today).catch(() => null);
  const words = wordsData ?? [];
  const schoolUnits = unitsForStage(await loadSchoolUnits(supabase), profile?.stage);
  const useSchool = schoolWordTotal(schoolUnits) > 0;
  const now = Date.now();
  const due = words.filter((w) => w.last_reviewed_at !== null && new Date(w.due_at).getTime() <= now).length;
  const waiting = words.filter((w) => w.source === (useSchool ? "school" : "path") && w.last_reviewed_at === null).length;

  const minutes = isDailyMinutes(profile?.daily_minutes) ? profile.daily_minutes : 15;
  const quota = newWordsQuota(settings.dailyGoalNewWords, minutes);
  const learnLeft = Math.max(quota - (day?.new_words ?? 0), waiting);
  const ownedTerms = new Set(words.map((w) => w.term));
  // The school curriculum leads; our own path only teaches when the admin has not uploaded school words yet.
  const nextSchool = useSchool ? nextSchoolWords(schoolUnits, ownedTerms, 1)[0] : undefined;
  const nextWord = useSchool ? undefined : nextPathWords(ownedTerms, 1, startUnitIndex(profile?.level_band))[0];
  const pathEnded = !nextWord && !nextSchool && waiting === 0;
  const unitName = useSchool
    ? (schoolUnits.find((unit) => unit.id === nextSchool?.unitId)?.titleAr ?? "")
    : (unitById(nextWord?.unitId ?? "")?.titleAr ?? "");

  const plan = planToday({
    due,
    learnLeft,
    pathEnded,
    readDone: Boolean(readToday?.completed_at),
    translatedToday: translatedToday ?? 0,
    spokeToday: spokeToday ?? 0,
  });

  const text = (step: PlannedStep): { title: string; hint: string } => {
    const titles: Record<StepKey, DictKey> = {
      review: "today.stepReview",
      learn: "today.stepLearn",
      read: "today.stepRead",
      translate: "today.stepTranslate",
      speak: "today.stepSpeak",
    };
    const hints: Record<StepKey, string> = {
      review: due === 0 ? t("today.stepReviewDone") : t("today.stepReviewHint", { n: due }),
      learn: pathEnded
        ? t("today.stepLearnEnd")
        : learnLeft === 0
          ? t("today.stepLearnDone")
          : t("today.stepLearnHint", { n: learnLeft, unit: unitName }),
      read: readToday?.completed_at ? t("today.stepReadDone") : t("today.stepReadHint"),
      translate: (translatedToday ?? 0) > 0 ? t("today.stepTranslateDone") : t("today.stepTranslateHint"),
      speak: (spokeToday ?? 0) > 0 ? t("today.stepSpeakDone") : t("today.stepSpeakHint"),
    };
    return { title: t(titles[step.key]), hint: hints[step.key] };
  };

  const allDone = plan.next === null;
  const learnedTotal = words.filter((w) => w.last_reviewed_at !== null).length;
  const progress = levelProgress(profile?.total_xp ?? 0);
  const bubble = bubbleFor({
    levelBand: profile?.level_band ?? null,
    streak: profile?.streak_current ?? 0,
    doneCount: plan.doneCount,
    total: plan.total,
    due,
    learned: learnedTotal,
  });
  const near = nearestBadge({
    words: learnedTotal,
    streak: Math.max(profile?.streak_current ?? 0, profile?.streak_longest ?? 0),
    xp: 0,
    read: 0,
    translate: 0,
    talk: 0,
    grammar: 0,
    writing: 0,
    listening: 0,
  });
  const nearUnits: Record<string, DictKey> = { words: "badges.nearWords", streak: "badges.nearStreak" };

  return (
    <div className="max-w-2xl xl:grid xl:max-w-5xl xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-8">
      <div className="space-y-5">
        <section className="space-y-4" aria-label={t("brand.ai")}>
          <div className="flex items-end gap-3">
            <BoMascot mood={allDone ? "happy" : "neutral"} size={120} className="shrink-0" />
            <div className="mb-2 min-w-0 flex-1 space-y-1 rounded-[26px] rounded-es-[6px] bg-sheet px-5 py-4 shadow-[var(--shadow-1)]">
              <p className="font-bold">{t("home.greeting", { name: profile?.display_name ?? "" })}</p>
              <p className="leading-7 text-ink-soft">{t(bubble.key, bubble.vars)}</p>
              {boNote && settings.boMessagesPerDay > 0 && (
                <p className="border-t border-line pt-2 text-sm leading-7 text-ink-faint">✦ {fillName(boNote.text, profile?.display_name ?? "")}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t("stats.today")}>
            <StatTile icon={<FlameIcon active={(profile?.streak_current ?? 0) > 0} />} label={t("stats.streak")} value={t("stats.streakValue", { n: profile?.streak_current ?? 0 })} sub={t("stats.streakBest", { n: Math.max(profile?.streak_longest ?? 0, profile?.streak_current ?? 0) })} />
            <StatTile icon={<XpIcon />} label={t("stats.level")} value={t("stats.levelValue", { n: progress.level })} ratio={progress.ratio} sub={t("stats.xp", { a: progress.currentXp, b: progress.neededXp })} />
            <StatTile icon={<WordsIcon />} label={t("stats.words")} value={t("stats.wordsValue", { n: learnedTotal })} sub={due > 0 ? t("stats.wordsDue", { n: due }) : t("stats.wordsClear")} />
            <StatTile icon={<SparkIcon />} label={t("stats.today")} value={t("stats.todayValue", { a: plan.doneCount, b: plan.total })} ratio={plan.total > 0 ? plan.doneCount / plan.total : 0} />
          </div>
        </section>

        {profile && chosenStage(profile.stage) === null && (
          <Link href="/me" className="sheet flex min-h-14 items-center justify-between gap-3 px-5 py-3 font-medium text-indigo">
            {t("stage.banner")}
            <span className="text-sm">{t("stage.bannerButton")}</span>
          </Link>
        )}

        {profile?.level_band == null ? (
          <Link href="/level" className="sheet flex min-h-14 items-center gap-3 px-5 py-3 font-medium text-indigo">
            <XpIcon />
            {t("today.levelBanner")}
          </Link>
        ) : (
          profile &&
          !profile.onboarded && (
            <Link href="/me" className="sheet flex min-h-14 items-center justify-between gap-3 px-5 py-3 font-medium text-indigo">
              {t("me.banner")}
              <span className="text-sm">{t("me.bannerButton")}</span>
            </Link>
          )
        )}

        <section className="hero-card space-y-4 p-5" aria-labelledby="focus-title">
          <div className="flex items-center justify-between gap-3">
            <h1 id="focus-title" className="text-xl font-semibold">
              {t("today.title")}
            </h1>
            <p className="text-sm opacity-85">{t("today.progress", { a: plan.doneCount, b: plan.total })}</p>
          </div>
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={plan.total}
            aria-valuenow={plan.doneCount}
            aria-label={t("today.title")}
          >
            {plan.steps
              .filter((step) => !step.extra)
              .map((step) => (
                <span key={step.key} className={`h-2 flex-1 rounded-full ${step.done ? "bg-leaf" : "bg-white/25"}`} />
              ))}
          </div>

          <ol className="space-y-2">
            {plan.steps.map((step) => {
              const isNext = plan.next?.key === step.key;
              const number = stepNumber(step.key);
              const { title, hint } = text(step);
              if (isNext) {
                return (
                  <li key={step.key} className="space-y-3 rounded-2xl bg-white p-4 text-ink shadow-[var(--shadow-1)]">
                    <p className="text-xs font-semibold text-indigo">{t("today.stepNumber", { a: number ?? 0, b: plan.total })}</p>
                    <div>
                      <p className="text-lg font-bold">{title}</p>
                      <p className="text-sm text-ink-soft">{hint}</p>
                    </div>
                    <Link href={STEP_HREF[step.key]} className="tag-btn w-full justify-center">
                      {t("today.go")}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={step.key}>
                  <Link
                    href={STEP_HREF[step.key]}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-2 ${step.done ? "bg-white/12" : "bg-white/8"} text-white`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step.done ? "bg-leaf" : "bg-white/20"}`}
                    >
                      {step.done ? "✓" : (number ?? "+")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">
                        {title}
                        {step.extra && (
                          <span className="ms-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">{t("today.extraTag")}</span>
                        )}
                      </span>
                      {!step.done && <span className="block truncate text-sm opacity-80">{hint}</span>}
                    </span>
                    <span className="sr-only">{step.done ? t("today.done") : t("today.go")}</span>
                  </Link>
                </li>
              );
            })}
          </ol>

          {allDone && (
            <div className="space-y-2">
              <p className="text-sm opacity-85">{t("today.allDoneExtra")}</p>
              {!pathEnded && (
                <Link href="/learn?more=1" className="tag-btn w-full justify-center sm:w-auto">
                  {t("today.moreWords")}
                </Link>
              )}
            </div>
          )}

          <MinutesPicker initial={minutes} />
        </section>
      </div>

      <aside className="mt-5 space-y-5 xl:sticky xl:top-6 xl:mt-0">
        <div className="grid grid-cols-2 gap-3">
          <BlockCard href="/words" tone="indigo" icon={<WordsIcon />} title={t("blocks.words")} hint={t("blocks.wordsHint")} />
          <BlockCard href="/grammar" tone="leaf" icon={<GrammarIcon />} title={t("blocks.explain")} hint={t("blocks.explainHint")} />
          <BlockCard href="/path" tone="amber" icon={<PathIcon />} title={t("blocks.path")} hint={t("blocks.pathHint")} />
          <BlockCard
            href="/challenge"
            tone="coral"
            icon={<SparkIcon />}
            title={t("blocks.challenge")}
            hint={challengeDone ? t("blocks.challengeDone", { a: challengeDone.score, b: challengeDone.max }) : t("challenge.todayHint")}
          />
          <BlockCard href="/talk" tone="cyan" icon={<ChatIcon />} title={t("blocks.talk")} hint={t("blocks.talkHint")} />
          <BlockCard href="/practice" tone="indigo" icon={<PracticeIcon />} title={t("blocks.more")} hint={t("blocks.moreHint")} />
        </div>

        {wordOfDay && (
          <section className="sheet space-y-2 rounded-[28px] p-5" aria-labelledby="wod-title">
            <h2 id="wod-title" className="text-sm font-semibold text-ink-faint">{t("wod.title")}</h2>
            <p className="flex items-center gap-3">
              <span className="ltr-text text-2xl font-bold">{wordOfDay.term}</span>
              <SpeakButton text={wordOfDay.term} label={t("wod.listen")} size="small" />
            </p>
            <p className="font-medium text-indigo">{wordOfDay.meaningAr}</p>
            {wordOfDay.story && <p className="text-sm leading-7 text-ink-soft">{wordOfDay.story}</p>}
          </section>
        )}

        {near && nearUnits[near.metric] && (
          <Link href="/achievements" className="sheet flex min-h-12 items-center justify-between gap-3 rounded-3xl px-5 py-3 text-sm font-medium text-indigo">
            {t("badges.near", { n: near.left, what: t(nearUnits[near.metric]), target: near.target })}
            <span aria-hidden="true" className="ltr:rotate-180">‹</span>
          </Link>
        )}
      </aside>
    </div>
  );
}
