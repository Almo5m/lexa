import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadBadgeStats } from "@/features/achievements/load";
import { METRICS, METRIC_TARGETS, earnedCount, progressOf } from "@/features/achievements/badges";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "Achievements" };

/** Badges earned from real study. Each group shows where the student is and how far the next badge is. */
export default async function AchievementsPage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const stats = await loadBadgeStats(supabase, user.id);
  const count = earnedCount(stats);

  return (
    <div className="max-w-2xl space-y-5 lg:max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">{t("badges.title")}</h1>
        <p className="text-ink-soft">{t("badges.summary", { a: count.earned, b: count.total })}</p>
      </div>

      <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
        {METRICS.map((metric) => {
          const progress = progressOf(metric, stats);
          const targets = METRIC_TARGETS[metric];
          const previous = progress.earned.length > 0 ? progress.earned[progress.earned.length - 1] : 0;
          const ratio = progress.next === null ? 1 : (progress.value - previous) / (progress.next - previous);
          return (
            <li key={metric} className="sheet space-y-3 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-bold">{t(`badges.${metric}` as DictKey)}</h2>
                <span className="ltr-text text-sm font-semibold text-indigo">{progress.value}</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-paper-deep"
                role="progressbar"
                aria-label={t(`badges.${metric}` as DictKey)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratio * 100)}
              >
                <div className="grad-fill h-2.5 rounded-full" style={{ width: `${Math.max(progress.value === 0 ? 0 : 4, Math.round(ratio * 100))}%` }} />
              </div>
              <ul className="flex flex-wrap gap-2">
                {targets.map((target) => {
                  const earned = progress.value >= target;
                  return (
                    <li
                      key={target}
                      className={`ltr-text rounded-full px-3 py-1 text-sm font-semibold ${earned ? "bg-leaf/20 text-ink" : "bg-paper-deep text-ink-faint"}`}
                    >
                      {earned ? "✓ " : ""}
                      {target}
                    </li>
                  );
                })}
              </ul>
              <p className="text-sm text-ink-soft">
                {progress.next === null ? t("badges.allDone") : t("badges.toNext", { n: progress.next - progress.value, target: progress.next })}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
