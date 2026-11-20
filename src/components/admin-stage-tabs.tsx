"use client";

import Link from "next/link";

export interface StageTabItem {
  value: string;
  label: string;
  /** A small number shown next to the label, like how many units it holds. */
  count?: number;
}

/** A row of links that filters an admin page by stage (`?tab=...&stage=...`). The current one is marked for screen readers too. */
export function AdminStageTabs({ tab, current, items, label }: { tab: string; current: string; items: StageTabItem[]; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1 rounded-lg border border-line bg-sheet p-1">
      {items.map((item) => (
        <Link
          key={item.value}
          href={`/admin?tab=${tab}&stage=${item.value}`}
          aria-current={current === item.value ? "page" : undefined}
          className={`flex min-h-10 items-center gap-2 rounded-md px-4 text-[15px] transition-colors ${current === item.value ? "bg-indigo font-semibold text-white" : "text-ink-soft hover:bg-paper-deep"}`}
        >
          {item.label}
          {item.count !== undefined && <span className={`text-xs ${current === item.value ? "text-white/80" : "text-ink-faint"}`}>{item.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
