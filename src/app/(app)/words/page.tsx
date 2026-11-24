import Link from "next/link";
import { BoMascot } from "@/components/bo-mascot";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { SchoolUnitCard } from "@/components/school-unit-card";
import { loadSchoolUnits, unitsForStage } from "@/features/school/load";
import { percent, unitProgress, type SchoolWordState } from "@/features/school/progress";
import { QuickAddWords } from "@/components/quick-add-words";
import { BUBBLE_CLASS, LEVELS, SORTS, SOURCES, countByLevel, filterWords, isLevel, isSort, isSource, levelOf, type BubbleWord } from "@/features/words/bubbles";
import { statusOf, type WordRow } from "@/lib/words";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "My words" };

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; group?: string; q?: string; tab?: string; source?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();

  const { data: stageRow } = await supabase.from("profiles").select("stage").eq("id", user.id).single();
  const schoolUnits = unitsForStage(await loadSchoolUnits(supabase), stageRow?.stage);
  const tab: "school" | "mine" = params.tab === "mine" ? "mine" : params.tab === "school" || schoolUnits.length > 0 ? "school" : "mine";

  const [{ data: wordsData }, { data: groups }] = await Promise.all([
    supabase
      .from("words")
      .select("id, term, card, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id, source, created_at")
      .order("term"),
    supabase.from("word_groups").select("id, name").order("name"),
  ]);

  const q = (params.q ?? "").trim().toLowerCase();
  const all = ((wordsData ?? []) as unknown as WordRow[]).map((row) => ({
    row,
    status: statusOf(row, settings),
  }));

  const tabs = (
    <nav aria-label={t("words.title")} className="flex gap-1 rounded-full bg-sheet p-1 shadow-[var(--shadow-1)]">
      {(["school", "mine"] as const).map((item) => (
        <Link
          key={item}
          href={`/words?tab=${item}`}
          aria-current={tab === item ? "page" : undefined}
          className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold ${
            tab === item ? "bg-[image:var(--grad)] text-white" : "text-ink-soft hover:bg-paper-deep"
          }`}
        >
          {t(item === "school" ? "words.tabSchool" : "words.tabMine")}
        </Link>
      ))}
    </nav>
  );

  if (tab === "school") {
    const statusByTerm = new Map(all.map(({ row, status }) => [row.term, row.last_reviewed_at === null ? ("todo" as const) : status]));
    const stateOf = (term: string): SchoolWordState => statusByTerm.get(term) ?? "todo";
    const progresses = schoolUnits.map((unit) => unitProgress(unit, stateOf));
    const total = progresses.reduce((sum, item) => sum + item.total, 0);
    const started = progresses.reduce((sum, item) => sum + item.started, 0);
    const mastered = progresses.reduce((sum, item) => sum + item.counts.mastered, 0);

    return (
      <div className="max-w-3xl space-y-6 lg:max-w-5xl">
        <h1 className="text-2xl font-semibold">{t("words.title")}</h1>
        {tabs}

        {schoolUnits.length === 0 ? (
          <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
            <BoMascot mood="neutral" size={130} />
            <p className="text-ink-soft">{t("words.schoolEmpty")}</p>
          </div>
        ) : (
          <>
            <section className="hero-card space-y-3 p-5" aria-label={t("words.schoolTitle")}>
              <h2 className="text-lg font-bold">{t("words.schoolTitle")}</h2>
              <p className="text-3xl font-bold">
                {started} / {total}
                <span className="ms-2 text-base font-normal opacity-85">{t("words.schoolStarted")}</span>
              </p>
              <div className="h-3 overflow-hidden rounded-full bg-white/30" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={started} aria-label={t("words.schoolTitle")}>
                <div className="h-3 rounded-full bg-white" style={{ width: `${started === 0 ? 0 : Math.max(4, percent(started, total))}%` }} />
              </div>
              <p className="text-sm opacity-90">{t("words.schoolMastered", { n: mastered })}</p>
              <Link href="/learn" className="tag-btn mt-1 justify-center sm:w-auto">
                {t("words.schoolContinue")}
              </Link>
            </section>

            <ul className="grid gap-3 lg:grid-cols-2">
              {schoolUnits.map((unit, index) => (
                <SchoolUnitCard
                  key={unit.id}
                  href={`/words/unit/${unit.id}`}
                  number={index + 1}
                  titleAr={unit.titleAr}
                  titleEn={unit.titleEn}
                  progress={progresses[index]}
                  barLabel={unit.titleAr}
                  summary={t("words.unitSummary", { a: progresses[index].started, b: progresses[index].total, c: progresses[index].counts.mastered })}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  const bubbleWords: BubbleWord[] = all.map(({ row, status }) => ({
    id: row.id,
    term: row.term,
    status,
    reviewed: row.last_reviewed_at !== null,
    correct: row.correct_count,
    wrong: row.wrong_count,
    source: isSource(row.source) ? row.source : "own",
    groupId: row.group_id,
    createdAt: row.created_at ?? "",
  }));
  const level = isLevel(params.filter) ? params.filter : undefined;
  const source = isSource(params.source) ? params.source : undefined;
  const sort = isSort(params.sort) ? params.sort : "az";
  const shown = filterWords(bubbleWords, { level, source, groupId: params.group, query: q, sort });
  const levelCounts = countByLevel(bubbleWords);

  const href = (next: Partial<{ filter: string; source: string; group: string; sort: string }>) => {
    const search = new URLSearchParams({ tab: "mine" });
    const pick = (key: "filter" | "source" | "group" | "sort", current: string | undefined) => {
      const value = key in next ? next[key] : current;
      if (value) search.set(key, value);
    };
    pick("filter", level);
    pick("source", source);
    pick("group", params.group);
    pick("sort", sort === "az" ? undefined : sort);
    if (q) search.set("q", q);
    return `/words?${search.toString()}`;
  };
  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
      active ? "bg-ink font-medium text-sheet" : "shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep"
    }`;

  return (
    <div className="max-w-3xl space-y-6 lg:max-w-5xl">
      <h1 className="text-2xl font-semibold">{t("words.title")}</h1>
      {tabs}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label={t("words.levelsTitle")}>
        {LEVELS.map((item) => (
          <Link
            key={item}
            href={href({ filter: level === item ? undefined : item })}
            aria-current={level === item ? "true" : undefined}
            className={`rounded-3xl border p-4 transition-transform active:scale-[0.98] ${BUBBLE_CLASS[item]} ${level === item ? "ring-2 ring-current" : ""}`}
          >
            <span className="block text-2xl font-bold">{levelCounts[item]}</span>
            <span className="block text-sm font-medium">{t(`mastery.${item}` as DictKey)}</span>
          </Link>
        ))}
      </section>

      <QuickAddWords groups={groups ?? []} />

      <section className="space-y-3" aria-label={t("words.filters")}>
        <form action="/words" className="flex gap-3">
          <input type="hidden" name="tab" value="mine" />
          {level && <input type="hidden" name="filter" value={level} />}
          {source && <input type="hidden" name="source" value={source} />}
          {params.group && <input type="hidden" name="group" value={params.group} />}
          {sort !== "az" && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="q" className="sr-only">{t("words.search")}</label>
          <input id="q" name="q" defaultValue={q} placeholder={t("words.search")} className="field ltr-text" />
        </form>

        <nav aria-label={t("words.bySource")} className="flex flex-wrap gap-2">
          <Link href={href({ source: undefined })} aria-current={!source ? "true" : undefined} className={chip(!source)}>{t("words.all")}</Link>
          {SOURCES.map((item) => (
            <Link key={item} href={href({ source: item })} aria-current={source === item ? "true" : undefined} className={chip(source === item)}>
              {t(`source.${item}` as DictKey)}
            </Link>
          ))}
        </nav>

        {groups && groups.length > 0 && (
          <nav aria-label={t("words.byGroup")} className="flex flex-wrap gap-2">
            <Link href={href({ group: undefined })} aria-current={!params.group ? "true" : undefined} className={chip(!params.group)}>{t("words.allGroups")}</Link>
            {groups.map((group) => (
              <Link key={group.id} href={href({ group: group.id })} aria-current={params.group === group.id ? "true" : undefined} className={chip(params.group === group.id)}>
                {group.name}
              </Link>
            ))}
          </nav>
        )}

        <nav aria-label={t("words.sortBy")} className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span>{t("words.sortBy")}</span>
          {SORTS.map((item) => (
            <Link key={item} href={href({ sort: item === "az" ? undefined : item })} aria-current={sort === item ? "true" : undefined} className={chip(sort === item)}>
              {t(`sort.${item}` as DictKey)}
            </Link>
          ))}
        </nav>
      </section>

      <p className="text-sm text-ink-faint">{t("words.shownCount", { a: shown.length, b: bubbleWords.length })}</p>

      {shown.length === 0 ? (
        <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
          <BoMascot mood={level === "weak" ? "happy" : "neutral"} size={130} />
          <p className="text-ink-soft">{level === "weak" ? t("words.emptyWeak") : t("words.empty")}</p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2.5" aria-label={t("words.title")}>
          {shown.map((word) => (
            <li key={word.id}>
              <Link
                href={`/words/${word.id}`}
                title={t(`mastery.${levelOf(word)}` as DictKey)}
                className={`ltr-text inline-flex min-h-11 items-center rounded-full border px-4 text-base font-medium transition-transform active:scale-[0.97] ${BUBBLE_CLASS[levelOf(word)]}`}
              >
                {word.term}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint" aria-label={t("words.levelsTitle")}>
        {LEVELS.map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-3 rounded-full border ${BUBBLE_CLASS[item]}`} />
            {t(`mastery.${item}` as DictKey)}
          </li>
        ))}
      </ul>
    </div>
  );
}
