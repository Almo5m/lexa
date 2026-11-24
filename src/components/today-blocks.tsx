import Link from "next/link";
import type { ReactNode } from "react";

/** One main block of the Today screen: a soft rounded bubble with an icon, a title and one line, all of it a link. */
export function BlockCard({ href, icon, title, hint, tone }: { href: string; icon: ReactNode; title: string; hint: string; tone: "indigo" | "leaf" | "amber" | "coral" | "cyan" }) {
  const tones: Record<typeof tone, string> = {
    indigo: "bg-indigo/10 text-indigo",
    leaf: "bg-leaf/12 text-leaf",
    amber: "bg-amber/15 text-amber",
    coral: "bg-pen-red/10 text-pen-red",
    cyan: "bg-cyan/12 text-cyan",
  };
  return (
    <Link href={href} className="sheet group flex min-h-32 flex-col justify-between gap-3 rounded-[28px] p-5 transition-transform active:scale-[0.98]">
      <span className={`grid size-11 place-items-center rounded-2xl ${tones[tone]}`} aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className="block text-lg font-bold">{title}</span>
        <span className="block text-sm leading-6 text-ink-soft">{hint}</span>
      </span>
    </Link>
  );
}

/** One number tile of the stats strip, with an optional progress bar under it. */
export function StatTile({ icon, label, value, sub, ratio }: { icon: ReactNode; label: string; value: string; sub?: string; ratio?: number }) {
  return (
    <div className="sheet space-y-1.5 rounded-3xl p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-ink-soft">
        <span aria-hidden="true" className="text-indigo">{icon}</span>
        {label}
      </p>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      {ratio !== undefined && (
        <div className="h-2 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)} aria-label={label}>
          <div className="h-full rounded-full bg-[image:var(--grad)]" style={{ width: `${Math.round(Math.min(Math.max(ratio, 0), 1) * 100)}%` }} />
        </div>
      )}
      {sub && <p className="text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}
