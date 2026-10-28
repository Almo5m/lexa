import Link from "next/link";
import { BoMascot } from "@/components/bo-mascot";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { SchoolUnitCard } from "@/components/school-unit-card";
import { loadSchoolUnits } from "@/features/school/load";
import { percent, unitProgress, type SchoolWordState } from "@/features/school/progress";
import { statusOf, type WordRow } from "@/lib/words";
import type { WordStatus } from "@/features/srs/types";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "My words" };

const FILTERS = ["all", "new", "learning", "weak", "mastered"] as const;
type Filter = (typeof FILTERS)[number];

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; group?: string; q?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const filter: Filter = FILTERS.includes(params.filter as Filter) ? (params.filter as Filter) : "all";
  const { supabase } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();

  const schoolUnits = await loadSchoolUnits(supabase);
  const tab: "school" | "mine" = params.tab === "mine" ? "mine" : params.tab === "school" || schoolUnits.length > 0 ? "school" : "mine";

  const [{ data: wordsData }, { data: groups }] = await Promise.all([
    supabase
      .from("words")
      .select("id, term, card, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id")
      .order("term"),
    supabase.from("word_groups").select("id, name").order("name"),
  ]);

  const q = (params.q ?? "").trim().toLowerCase();
  const all = ((wordsData ?? []) as unknown as WordRow[]).map((row) => ({
    row,
    status: statusOf(row, settings),
  }));

  const visible = all.filter(
    ({ row, status }) =>
      (filter === "all" || status === filter) &&
      (!params.group || row.group_id === params.group) &&
      (!q || row.term.includes(q)),
  );

  const counts: Record<Filter, number> = {
    all: all.length,
    new: all.filter((w) => w.status === "new").length,
    learning: all.filter((w) => w.status === "learning").length,
    weak: all.filter((w) => w.status === "weak").length,
    mastered: all.filter((w) => w.status === "mastered").length,
  };

  const statusLabel: Record<WordStatus, DictKey> = {
    new: "card.status.new",
    learning: "card.status.learning",
    weak: "card.status.weak",
    mastered: "card.status.mastered",
  };

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

  const href = (next: Partial<{ filter: string; group: string }>) => {
    const search = new URLSearchParams({ tab: "mine" });
    const f = next.filter ?? filter;
    const g = "group" in next ? next.group : params.group;
    if (f !== "all") search.set("filter", f);
    if (g) search.set("group", g);
    if (q) search.set("q", q);
    const text = search.toString();
    return `/words?${text}`;
  };

  return (
    <div className="max-w-3xl space-y-6 lg:max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("words.title")}</h1>
        <Link href="/add" className="tag-btn min-h-11 text-sm">
          {t("words.add")}
        </Link>
      </div>

      {tabs}

      <form action="/words" className="flex gap-3">
        <input type="hidden" name="tab" value="mine" />
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        {params.group && <input type="hidden" name="group" value={params.group} />}
        <label htmlFor="q" className="sr-only">
          {t("words.search")}
        </label>
        <input id="q" name="q" defaultValue={q} placeholder={t("words.search")} className="field ltr-text" />
      </form>

      <nav aria-label={t("words.title")} className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Link
            key={item}
            href={href({ filter: item })}
            aria-current={filter === item ? "true" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
              filter === item ? "bg-ink font-medium text-sheet" : "shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep"
            }`}
          >
            {t(`words.${item}` as DictKey)} · {counts[item]}
          </Link>
        ))}
      </nav>

      {groups && groups.length > 0 && (
        <nav aria-label="Groups" className="flex flex-wrap gap-2 text-sm">
          <Link href={href({ group: undefined })} className="min-h-11 content-center px-2 transition-colors hover:text-indigo">
            {t("words.all")}
          </Link>
          {groups.map((group) => (
            <Link
              key={group.id}
              href={href({ group: group.id })}
              aria-current={params.group === group.id ? "true" : undefined}
              className={`min-h-11 content-center px-2 transition-colors hover:text-indigo ${params.group === group.id ? "font-semibold" : "text-ink-soft"}`}
            >
              {group.name}
            </Link>
          ))}
        </nav>
      )}

      {visible.length === 0 ? (
        <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
          <BoMascot mood={filter === "weak" ? "happy" : "neutral"} size={130} />
          <p className="text-ink-soft">{filter === "weak" ? t("words.emptyWeak") : t("words.empty")}</p>
        </div>
      ) : (
        <ul className="border-t border-line lg:columns-2 lg:gap-x-10">
          {visible.map(({ row, status }) => (
            <li key={row.id} className="break-inside-avoid border-b border-line">
              <Link
                href={`/words/${row.id}`}
                className="flex min-h-14 items-center justify-between gap-4 px-1 hover:bg-paper-deep/60"
              >
                <span className="ltr-text text-lg font-medium">{row.term}</span>
                <span className="flex items-center gap-3 text-sm text-ink-soft">
                  <span className={status === "weak" ? "font-semibold text-pen-red" : status === "mastered" ? "text-leaf" : ""}>
                    {t(statusLabel[status])}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
