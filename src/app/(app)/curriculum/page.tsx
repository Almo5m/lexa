import Link from "next/link";
import { BoMascot } from "@/components/bo-mascot";
import { SchoolUnitCard } from "@/components/school-unit-card";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { GRAMMAR_UNITS } from "@/features/grammar";
import { loadTopics } from "@/features/grammar/topics";
import { LISTENING_TASKS } from "@/features/listening/tasks";
import { writingTasksFor } from "@/features/writing/tasks";
import { loadSchoolUnits, unitsForStage } from "@/features/school/load";
import { unitProgress, type SchoolWordState } from "@/features/school/progress";
import { chosenStage, hasBook } from "@/features/stage/stage";
import { bookFor } from "@/features/stage/books";
import { buildOverview } from "@/features/stage/overview";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "My curriculum" };

const TONE: Record<string, string> = {
  empty: "text-ink-faint",
  todo: "text-ink-soft",
  progress: "text-indigo",
  done: "text-leaf",
};

/** Everything of the student's school year in one place: words, grammar, writing, listening, speaking, and how far he is in each. */
export default async function CurriculumPage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();

  const { data: profile } = await supabase.from("profiles").select("stage").eq("id", user.id).single();
  const stage = chosenStage(profile?.stage);
  const book = hasBook(profile?.stage);

  const [units, topics, wordsData, scoresData] = await Promise.all([
    loadSchoolUnits(supabase).then((all) => unitsForStage(all, profile?.stage)),
    stage ? loadTopics(supabase, stage) : Promise.resolve([]),
    supabase.from("words").select("term, last_reviewed_at").not("last_reviewed_at", "is", null),
    supabase.from("book_scores").select("kind, item_id"),
  ]);

  const studied = new Set((wordsData.data ?? []).map((row) => row.term));
  const stateOf = (term: string): SchoolWordState => (studied.has(term) ? "learning" : "todo");
  const progresses = units.map((unit) => unitProgress(unit, stateOf));
  const wordsTotal = progresses.reduce((sum, item) => sum + item.total, 0);
  const wordsStarted = progresses.reduce((sum, item) => sum + item.started, 0);

  const overview = buildOverview({
    wordsTotal,
    wordsStarted,
    grammarTopics: topics.length,
    scores: (scoresData.data ?? []) as { kind: "grammar" | "writing" | "listening"; item_id: string }[],
    grammarUnits: book ? GRAMMAR_UNITS.length : 0,
    writingTasks: writingTasksFor(stage).length,
    listeningTasks: book ? LISTENING_TASKS.length : 0,
  });

  const roadmap = bookFor(stage);
  const writingByUnit = new Map(writingTasksFor(stage).map((task) => [task.unit, task]));
  const stageName = stage ? t(`stage.${stage}` as DictKey) : t("cur.allStages");
  const openUnits = units.map((unit, index) => ({ unit, index, progress: progresses[index] })).filter((item) => item.progress.started < item.progress.total).slice(0, 3);

  return (
    <div className="max-w-3xl space-y-6 lg:max-w-5xl">
      <section className="hero-card flex items-center gap-4 p-5" aria-label={t("cur.title")}>
        <BoMascot mood="happy" size={96} className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm opacity-90">{stageName}</p>
          <h1 className="text-2xl font-bold">{t("cur.title")}</h1>
          {overview.overall !== null && (
            <>
              <p className="text-lg font-semibold">{t("cur.overall", { n: overview.overall })}</p>
              <div className="h-3 overflow-hidden rounded-full bg-white/30" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overview.overall} aria-label={t("cur.title")}>
                <div className="h-3 rounded-full bg-white" style={{ width: `${Math.max(overview.overall, 3)}%` }} />
              </div>
            </>
          )}
        </div>
      </section>

      {overview.next && (
        <Link href={overview.next.href} className="sheet flex min-h-14 items-center justify-between gap-3 rounded-3xl px-5 py-3 font-medium text-indigo">
          <span>{t("cur.next", { part: t(`cur.part.${overview.next.id}` as DictKey) })}</span>
          <span aria-hidden="true" className="ltr:rotate-180">‹</span>
        </Link>
      )}

      <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("cur.title")}>
        {overview.parts.map((part) => (
          <li key={part.id}>
            <Link href={part.href} className="sheet flex h-full min-h-36 flex-col justify-between gap-3 rounded-[28px] p-5 transition-transform active:scale-[0.98]">
              <span>
                <span className="block text-lg font-bold">{t(`cur.part.${part.id}` as DictKey)}</span>
                <span className="block text-sm leading-6 text-ink-soft">{t(`cur.hint.${part.id}` as DictKey)}</span>
              </span>
              <span className="space-y-1.5">
                {part.percent !== null && (
                  <span className="block h-2 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={part.percent} aria-label={t(`cur.part.${part.id}` as DictKey)}>
                    <span className="block h-full rounded-full bg-[image:var(--grad)]" style={{ width: `${Math.max(part.percent, part.done ? 4 : 0)}%` }} />
                  </span>
                )}
                <span className={`block text-sm font-medium ${TONE[part.state]}`}>
                  {part.total !== null && part.state !== "empty"
                    ? part.done === null
                      ? t("cur.count", { n: part.total })
                      : t("cur.progress", { a: part.done, b: part.total })
                    : t(`cur.state.${part.state}` as DictKey)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {roadmap.length > 0 && (
        <section className="space-y-3" aria-labelledby="cur-book">
          <h2 id="cur-book" className="text-lg font-bold">{t("cur.bookTitle")}</h2>
          <ol className="grid gap-3 lg:grid-cols-2">
            {roadmap.map((unit) => {
              const task = writingByUnit.get(unit.number);
              return (
                <li key={unit.number} className="sheet flex gap-4 rounded-3xl p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo/10 text-lg font-bold text-indigo" aria-hidden="true">{unit.number}</span>
                  <span className="min-w-0 space-y-1">
                    <span className="ltr-text block font-semibold">{unit.titleEn}</span>
                    <span className="block text-sm text-ink-soft">{t("cur.grammarFocus")}: <span className="ltr-text">{unit.grammarEn}</span></span>
                    {task && (
                      <Link href={`/writing/${task.id}`} className="inline-flex min-h-9 items-center text-sm font-medium text-indigo">
                        {t("cur.writeTask")}: <span className="ltr-text ms-1">{task.titleEn}</span>
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {openUnits.length > 0 && (
        <section className="space-y-3" aria-labelledby="cur-units">
          <h2 id="cur-units" className="text-lg font-bold">{t("cur.openUnits")}</h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {openUnits.map(({ unit, index, progress }) => (
              <SchoolUnitCard
                key={unit.id}
                href={`/words/unit/${unit.id}`}
                number={index + 1}
                titleAr={unit.titleAr}
                titleEn={unit.titleEn}
                progress={progress}
                barLabel={unit.titleAr}
                summary={t("words.unitSummary", { a: progress.started, b: progress.total, c: progress.counts.mastered })}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
