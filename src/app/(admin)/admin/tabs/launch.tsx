import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkReadiness } from "@/features/admin/readiness";
import type { DictKey } from "@/lib/i18n/dictionary";

const MANUAL = ["phone", "teacher", "privacy", "backup", "region", "domain"] as const;

/** Launch readiness: the real project is checked, and what only a person can check is listed below it. */
export async function LaunchTab() {
  const { t } = await getT();
  const readiness = await checkReadiness(createSupabaseAdminClient());
  const group = (level: "must" | "should") => readiness.checks.filter((check) => check.level === level);

  return (
    <div className="space-y-6">
      <div className={`rounded-[var(--r-md)] border-s-4 p-4 ${readiness.ready ? "border-leaf bg-leaf/10" : "border-pen-red bg-pen-red/10"}`} role="status">
        <p className="font-bold">{readiness.ready ? t("launch.ready") : t("launch.notReady")}</p>
      </div>

      {(["must", "should"] as const).map((level) => (
        <section key={level} className="sheet space-y-2 p-5" aria-labelledby={`launch-${level}`}>
          <h2 id={`launch-${level}`} className="text-lg font-bold">{t(`launch.level.${level}` as DictKey)}</h2>
          <ul className="divide-y divide-line">
            {group(level).map((check) => (
              <li key={check.id} className="flex items-start gap-3 py-3">
                <span aria-hidden="true" className={`mt-0.5 font-bold ${check.ok ? "text-leaf" : "text-pen-red"}`}>{check.ok ? "✓" : "✗"}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {t(`launch.check.${check.id}` as DictKey)}
                    {check.count !== undefined && <span className="ltr-text ms-2 text-sm text-ink-soft">({check.count})</span>}
                  </span>
                  {!check.ok && <span className="block text-sm text-ink-soft">{t(`launch.fix.${check.id}` as DictKey)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="sheet space-y-2 p-5" aria-labelledby="launch-manual">
        <h2 id="launch-manual" className="text-lg font-bold">{t("launch.manual")}</h2>
        <ul className="list-inside list-disc space-y-1 text-ink-soft">
          {MANUAL.map((item) => <li key={item}>{t(`launch.manual.${item}` as DictKey)}</li>)}
        </ul>
      </section>
    </div>
  );
}
