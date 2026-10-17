import type { Meter } from "@/features/skills/meters";

export interface SkillMeter extends Meter {
  key: string;
  label: string;
  hint: string;
}

/** Four bars: words, understanding, translation and speaking. A bar with no data says so instead of showing a fake number. */
export function SkillMeters({ meters, title, emptyText }: { meters: SkillMeter[]; title: string; emptyText: string }) {
  return (
    <section aria-labelledby="skills-title">
      <h2 id="skills-title" className="mb-3 text-lg font-bold">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {meters.map((meter) => (
          <div key={meter.key} className="sheet px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{meter.label}</span>
              <span className="ltr-text text-sm font-semibold text-indigo">{meter.value}</span>
            </div>
            <div
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper-deep"
              role="progressbar"
              aria-label={meter.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={meter.percent ?? 0}
            >
              <div className="grad-fill h-2.5 rounded-full" style={{ width: `${meter.percent === null ? 0 : Math.max(4, meter.percent)}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-faint">{meter.percent === null ? emptyText : meter.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
