"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AddIcon, DashboardIcon, HomeIcon, ReviewIcon, WordsIcon } from "@/components/icons";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: DictKey;
  icon: ReactNode;
}

const items: NavItem[] = [
  { href: "/", label: "nav.home", icon: <HomeIcon /> },
  { href: "/add", label: "nav.add", icon: <AddIcon /> },
  { href: "/words", label: "nav.words", icon: <WordsIcon /> },
  { href: "/review", label: "nav.review", icon: <ReviewIcon /> },
];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useT();
  const all = isAdmin
    ? [...items, { href: "/admin", label: "nav.admin" as DictKey, icon: <DashboardIcon /> }]
    : items;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-sheet pb-[env(safe-area-inset-bottom)] md:static md:inset-auto md:w-56 md:flex-col md:gap-1 md:border-t-0 md:bg-transparent md:p-4"
    >
      {all.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-2 text-xs md:min-h-12 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-md md:px-3 md:text-base ${
              active ? "font-semibold text-ink md:bg-marker" : "text-ink-faint hover:text-ink"
            }`}
          >
            <span className={active ? "rounded-full bg-marker px-4 py-0.5 md:bg-transparent md:p-0" : "px-4 py-0.5 md:p-0"}>
              {item.icon}
            </span>
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
