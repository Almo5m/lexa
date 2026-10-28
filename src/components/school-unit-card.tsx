import Link from "next/link";
import type { UnitProgress } from "@/features/school/progress";
import { percent } from "@/features/school/progress";

/** A stacked bar: mastered, learning and weak words of one unit. Not-started words are the empty track. */
export function UnitBar({ progress, label }: { progress: UnitProgress; label: string }) {
  const { total, counts } = progress;
  const part = (n: number) => `${percent(n, total)}%`;
  return (
    <div
      className="flex h-3 overflow-hidden rounded-full bg-paper-deep"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={progress.started}
    >
      <span className="bg-leaf" style={{ width: part(counts.mastered) }} />
      <span className="bg-indigo" style={{ width: part(counts.learning + counts.new) }} />
      <span className="bg-pen-red" style={{ width: part(counts.weak) }} />
    </div>
  );
}

export function SchoolUnitCard({
  href,
  number,
  titleAr,
  titleEn,
  progress,
  summary,
  barLabel,
}: {
  href: string;
  number: number;
  titleAr: string;
  titleEn: string;
  progress: UnitProgress;
  summary: string;
  barLabel: string;
}) {
  const done = progress.total > 0 && progress.counts.mastered === progress.total;
  return (
    <li>
      <Link href={href} className="sheet block space-y-3 p-4">
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`grid size-11 shrink-0 place-items-center rounded-2xl border-b-4 text-lg font-bold text-white ${
              done ? "border-[#0b7a4d] bg-leaf" : "border-[#1f35b8] bg-indigo"
            }`}
          >
            {done ? "✓" : number}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-bold">{titleAr}</span>
            {titleEn && <span className="ltr-text block truncate text-sm text-ink-soft">{titleEn}</span>}
          </span>
          <span aria-hidden="true" className="text-indigo ltr:rotate-180">‹</span>
        </span>
        <UnitBar progress={progress} label={barLabel} />
        <span className="block text-sm text-ink-soft">{summary}</span>
      </Link>
    </li>
  );
}
