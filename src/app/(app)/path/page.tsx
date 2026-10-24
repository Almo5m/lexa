import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { SkillMeters } from "@/components/skill-meters";
import { UNITS, pathSizeFrom, startUnitIndex } from "@/features/curriculum";
import { levelProgress } from "@/features/gamification/xp";
import { loadSkillMeters } from "@/features/skills/load";
import { currentUnit, unitProgress, type WordState } from "@/features/curriculum/progress";
import type { DictKey } from "@/lib/i18n/dictionary";

const LEVELS = ["A1", "A2", "B1"] as const;

export const metadata = { title: "Path" };

export default async function PathPage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const { data: profile } = await supabase.from("profiles").select("level_band, total_xp").eq("id", user.id).single();
  const startUnit = startUnitIndex(profile?.level_band);
  const { data } = await supabase.from("words").select("term, repetitions, last_reviewed_at").eq("source", "path");

  const states = new Map<string, WordState>(
    (data ?? []).map((row) => [row.term, { learned: row.last_reviewed_at !== null, repetitions: row.repetitions }]),
  );
  const progress = UNITS.map((unit) => unitProgress(unit, states));
  const current = currentUnit(progress.slice(startUnit));
  const learned = [...states.values()].filter((state) => state.learned).length;
  const meters = await loadSkillMeters(supabase, user.id, { learned, total: pathSizeFrom(startUnit) });
  const level = levelProgress(profile?.total_xp ?? 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("path.title")}</h1>
        <p className="text-ink-soft">{t("path.hint")}</p>
      </div>

      <Link href="/achievements" className="sheet flex min-h-14 items-center justify-between gap-3 px-5 py-3">
        <span>
          <span className="block font-semibold">{t("badges.link")}</span>
          <span className="block text-sm text-ink-soft">{t("badges.linkHint")}</span>
        </span>
        <span aria-hidden="true" className="text-indigo ltr:rotate-180">‹</span>
      </Link>

      <SkillMeters
        title={t("skills.title")}
        emptyText={t("skills.empty")}
        meters={[
          { key: "words", label: t("skills.words"), hint: t("skills.wordsHint"), ...meters.words },
          { key: "read", label: t("skills.read"), hint: t("skills.readHint"), ...meters.read },
          { key: "translate", label: t("skills.translate"), hint: t("skills.translateHint"), ...meters.translate },
          { key: "speak", label: t("skills.speak"), hint: t("skills.speakHint"), ...meters.speak },
          { key: "book", label: t("skills.book"), hint: t("skills.bookHint"), ...meters.book },
        ]}
      />

      <section className="sheet px-5 py-4" aria-label={t("home.level", { n: level.level })}>
        <div className="flex items-center justify-between font-semibold">
          <span>{t("home.level", { n: level.level })}</span>
          <span className="text-sm font-normal text-ink-faint">{t("home.xpToNext", { n: level.neededXp - level.currentXp })}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={level.neededXp} aria-valuenow={level.currentXp}>
          <div className="grad-fill h-3 rounded-full" style={{ width: `${Math.max(4, Math.round(level.ratio * 100))}%` }} />
        </div>
      </section>

      <h2 className="text-lg font-bold">{t("path.mapTitle")}</h2>
      <div className="space-y-3">
        {LEVELS.map((level) => {
          const indexes = UNITS.flatMap((unit, index) => (unit.level === level ? [index] : []));
          const finished = indexes.filter((index) => progress[index].state === "learned" || progress[index].state === "mastered").length;
          const holdsCurrent = indexes.some((index) => UNITS[index].id === current?.unitId);
          return (
            <details key={level} open={holdsCurrent} className="sheet p-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3">
                <span>
                  <span className="block text-lg font-bold">
                    {level} · {t(`path.level.${level}` as DictKey)}
                  </span>
                  <span className="block text-sm text-ink-soft">{t("path.levelSummary", { a: finished, b: indexes.length })}</span>
                </span>
                <span aria-hidden="true" className="text-indigo">
                  ⌄
                </span>
              </summary>
              <ol className="mt-3 space-y-2">
                {indexes.map((index) => {
                  const unit = UNITS[index];
                  const item = progress[index];
                  const isCurrent = current?.unitId === unit.id;
                  const skipped = index < startUnit && item.learned === 0;
                  const stateLabel = skipped ? t("path.skipped") : t(`path.state.${item.state}` as DictKey);

                  if (!isCurrent) {
                    return (
                      <li key={unit.id} className={`rounded-2xl bg-paper px-4 py-2 ring-1 ring-line ${skipped ? "opacity-60" : ""}`}>
                        <div className="flex min-h-10 items-center justify-between gap-3">
                          <p className="min-w-0 truncate font-semibold">
                            <span className="text-ink-faint">{index + 1}.</span> {unit.titleAr}
                          </p>
                          <span className="shrink-0 rounded-full bg-paper-deep px-3 py-1 text-xs font-semibold">{stateLabel}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-ink-soft">{t("path.counts", { a: item.learned, b: item.total, c: item.mastered })}</p>
                          {item.learned > 0 && (
                            <Link href={`/review?unit=${unit.id}`} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-indigo">
                              {t("path.test")}
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={unit.id} className="space-y-3 rounded-2xl bg-paper p-4 ring-2 ring-violet">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-ink-faint">{t("path.unit", { n: index + 1 })}</p>
                          <h3 className="text-lg font-bold">{unit.titleAr}</h3>
                          <p className="ltr-text text-sm text-ink-soft">{unit.titleEn}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-paper-deep px-3 py-1 text-xs font-semibold">{stateLabel}</span>
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
                          <Link href="/learn" className="tag-btn min-h-11 text-sm">
                            {t("path.continue")}
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>
      <p className="text-sm text-ink-faint">{t("path.more")}</p>
    </div>
  );
}
