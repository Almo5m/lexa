import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { UNITS } from "@/features/curriculum";
import { currentUnit, unitProgress, type WordState } from "@/features/curriculum/progress";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "Path" };

export default async function PathPage() {
  const { supabase } = await requireUserPage();
  const { t } = await getT();
  const { data } = await supabase.from("words").select("term, repetitions, last_reviewed_at").eq("source", "path");

  const states = new Map<string, WordState>(
    (data ?? []).map((row) => [row.term, { learned: row.last_reviewed_at !== null, repetitions: row.repetitions }]),
  );
  const progress = UNITS.map((unit) => unitProgress(unit, states));
  const current = currentUnit(progress);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("path.title")}</h1>
        <p className="text-ink-soft">{t("path.hint")}</p>
      </div>
      <ol className="space-y-3">
        {UNITS.map((unit, index) => {
          const item = progress[index];
          const isCurrent = current?.unitId === unit.id;
          return (
            <li key={unit.id} className={`sheet space-y-3 p-4 ${isCurrent ? "ring-2 ring-violet" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-ink-faint">
                    {unit.level} · {t("path.unit", { n: index + 1 })}
                  </p>
                  <h2 className="text-lg font-bold">{unit.titleAr}</h2>
                  <p className="ltr-text text-sm text-ink-soft">{unit.titleEn}</p>
                </div>
                <span className="shrink-0 rounded-full bg-paper-deep px-3 py-1 text-xs font-semibold">{t(`path.state.${item.state}` as DictKey)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-label={unit.titleAr} aria-valuemin={0} aria-valuemax={item.total} aria-valuenow={item.learned}>
                <div className="grad-fill h-2.5 rounded-full" style={{ width: `${item.learned === 0 ? 0 : Math.max(4, Math.round((item.learned / item.total) * 100))}%` }} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-soft">{t("path.counts", { a: item.learned, b: item.total, c: item.mastered })}</p>
                <div className="flex gap-2">
                  {item.learned > 0 && (
                    <Link href={`/review?unit=${unit.id}`} className="tag-btn tag-btn-quiet min-h-11 text-sm">
                      {t("path.test")}
                    </Link>
                  )}
                  {isCurrent && (
                    <Link href="/learn" className="tag-btn min-h-11 text-sm">
                      {t("path.continue")}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-ink-faint">{t("path.more")}</p>
    </div>
  );
}
