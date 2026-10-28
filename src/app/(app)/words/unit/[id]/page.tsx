import Link from "next/link";
import { notFound } from "next/navigation";
import { UnitBar } from "@/components/school-unit-card";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { loadSchoolUnit } from "@/features/school/load";
import { unitProgress, type SchoolWordState } from "@/features/school/progress";
import { statusOf, type WordRow } from "@/lib/words";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "Unit" };

const CHIP: Record<SchoolWordState, string> = {
  todo: "bg-paper-deep text-ink-faint",
  new: "bg-indigo/10 text-indigo",
  learning: "bg-indigo/10 text-indigo",
  weak: "bg-pen-red/15 text-pen-red",
  mastered: "bg-leaf/20 text-ink",
};

const LABEL: Record<SchoolWordState, DictKey> = {
  todo: "words.stateTodo",
  new: "card.status.new",
  learning: "card.status.learning",
  weak: "card.status.weak",
  mastered: "card.status.mastered",
};

/** One school unit: how far the student is, a button to study it or test himself, and every word with its state. */
export default async function SchoolUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();

  const unit = await loadSchoolUnit(supabase, id);
  if (!unit) notFound();

  const { data } = await supabase
    .from("words")
    .select("id, term, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at")
    .in("term", unit.words.map((word) => word.term));
  const owned = new Map(((data ?? []) as unknown as WordRow[]).map((row) => [row.term, row]));
  const stateOf = (term: string): SchoolWordState => {
    const row = owned.get(term);
    return !row || row.last_reviewed_at === null ? "todo" : statusOf(row, settings);
  };
  const progress = unitProgress(unit, stateOf);
  const left = progress.counts.todo;

  return (
    <div className="max-w-3xl space-y-6 lg:max-w-5xl">
      <Link href="/words?tab=school" className="inline-flex min-h-11 items-center text-ink-soft transition-colors hover:text-indigo">
        {t("words.backToUnits")}
      </Link>

      <header className="sheet space-y-4 p-5">
        <div>
          <h1 className="text-2xl font-semibold">{unit.titleAr}</h1>
          {unit.titleEn && <p className="ltr-text text-ink-soft">{unit.titleEn}</p>}
        </div>
        <UnitBar progress={progress} label={unit.titleAr} />
        <ul className="flex flex-wrap gap-2 text-sm">
          {(["mastered", "learning", "weak", "todo"] as const).map((key) => (
            <li key={key} className={`rounded-full px-3 py-1 font-semibold ${CHIP[key]}`}>
              {t(LABEL[key])} · {key === "learning" ? progress.counts.learning + progress.counts.new : progress.counts[key]}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          {left > 0 && (
            <Link href={`/learn?unit=${unit.id}`} className="tag-btn tag-btn-grad">
              {t("words.unitStudy", { n: Math.min(left, 10) })}
            </Link>
          )}
          {progress.started > 0 && (
            <Link href={`/review?unit=${unit.id}`} className="tag-btn tag-btn-quiet">
              {t("words.unitTest")}
            </Link>
          )}
        </div>
      </header>

      {unit.words.length === 0 ? (
        <p className="text-ink-soft">{t("words.unitEmpty")}</p>
      ) : (
        <ul className="border-t border-line lg:columns-2 lg:gap-x-10">
          {unit.words.map((word) => {
            const state = stateOf(word.term);
            const row = owned.get(word.term);
            const inner = (
              <>
                <span className="min-w-0">
                  <span className="ltr-text block text-lg font-medium">
                    {word.term}
                    {word.pos && <span className="ms-2 text-xs font-normal text-ink-faint">{word.pos}</span>}
                  </span>
                  <span className="block truncate text-sm text-ink-soft">{word.meaningAr}</span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${CHIP[state]}`}>{t(LABEL[state])}</span>
              </>
            );
            return (
              <li key={word.id} className="break-inside-avoid border-b border-line">
                {row && state !== "todo" ? (
                  <Link href={`/words/${row.id}`} className="flex min-h-16 items-center justify-between gap-4 px-1 hover:bg-paper-deep/60">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex min-h-16 items-center justify-between gap-4 px-1">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
