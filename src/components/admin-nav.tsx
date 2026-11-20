"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { ADMIN_GROUPS, isAdminTab, type AdminTab, type BadgeCounts } from "@/features/admin/nav";
import type { DictKey } from "@/lib/i18n/dictionary";

/** The dashboard menu: a fixed sidebar on wide screens, a collapsible list on phones. Groups follow the work, not the code. */
export function AdminNav({ counts }: { counts: BadgeCounts }) {
  const { t } = useT();
  const raw = useSearchParams().get("tab");
  const active: AdminTab = isAdminTab(raw) ? raw : "overview";
  const waiting = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  const list = (
    <nav aria-label={t("admin.title")} className="space-y-5">
      {ADMIN_GROUPS.map((group) => (
        <div key={group.key} className="space-y-1">
          {group.key !== "main" && <p className="px-3 text-xs font-semibold tracking-wide text-ink-faint">{t(`admin.group.${group.key}` as DictKey)}</p>}
          <ul className="space-y-0.5">
            {group.tabs.map((tab) => {
              const count = counts[tab] ?? 0;
              return (
                <li key={tab}>
                  <Link
                    href={tab === "overview" ? "/admin" : `/admin?tab=${tab}`}
                    aria-current={active === tab ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-[15px] transition-colors ${
                      active === tab ? "bg-paper-deep font-semibold text-ink shadow-[inset_3px_0_0_var(--color-cyan)] rtl:shadow-[inset_-3px_0_0_var(--color-cyan)]" : "text-ink-soft hover:bg-paper-deep/60 hover:text-ink"
                    }`}
                  >
                    {t(`admin.tab.${tab}` as DictKey)}
                    {count > 0 && <span className="min-w-6 rounded-full bg-amber/20 px-2 text-center text-xs font-semibold text-amber">{count}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <details className="rounded-lg border border-line bg-sheet lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold">
          <span>{t(`admin.tab.${active}` as DictKey)}</span>
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            {waiting > 0 && <span className="rounded-full bg-amber/20 px-2 text-xs font-semibold text-amber">{waiting}</span>}
            {t("admin.menu")}
          </span>
        </summary>
        <div className="border-t border-line p-3">{list}</div>
      </details>
      <aside className="sticky top-4 hidden max-h-[calc(100dvh-2rem)] w-60 shrink-0 self-start overflow-y-auto lg:block">{list}</aside>
    </>
  );
}
