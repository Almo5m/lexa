"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardIcon, HomeIcon, BoIcon, PathIcon, PracticeIcon, WordsIcon } from "@/components/icons";
import { BoChatLauncher } from "@/components/bo-chat-sheet";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface NavLink {
  href: string;
  label: DictKey;
  icon: ReactNode;
  also?: string[];
  tour?: string;
}

/** Pages that belong to a tab without being its own route, so the tab stays lit while the student works. */
const TODAY_PATHS = ["/learn", "/read"];
const PRACTICE_PATHS = ["/review", "/quiz", "/translate", "/level", "/suggest", "/talk"];
const WORDS_PATHS = ["/add"];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useT();

  const isActive = (link: NavLink) =>
    link.href === "/"
      ? pathname === "/" || (link.also ?? []).some((prefix) => pathname.startsWith(prefix))
      : [link.href, ...(link.also ?? [])].some((prefix) => pathname.startsWith(prefix));

  const home: NavLink = { href: "/", label: "nav.home", icon: <HomeIcon />, also: TODAY_PATHS, tour: "today" };
  const path: NavLink = { href: "/path", label: "nav.path", icon: <PathIcon />, tour: "path" };
  const practice: NavLink = { href: "/practice", label: "nav.practice", icon: <PracticeIcon />, also: PRACTICE_PATHS, tour: "practice" };
  const words: NavLink = { href: "/words", label: "nav.words", icon: <WordsIcon />, also: WORDS_PATHS, tour: "words" };

  const tabClass = (active: boolean) =>
    `flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-xs lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-full lg:px-4 lg:text-base ${
      active ? "font-bold text-indigo rounded-2xl bg-indigo/10" : "rounded-2xl text-ink-faint hover:text-ink"
    }`;

  const plain = (link: NavLink) => (
    <Link
      key={link.href}
      href={link.href}
      data-tour={link.tour}
      aria-current={isActive(link) ? "page" : undefined}
      className={tabClass(isActive(link))}
    >
      {link.icon}
      {t(link.label)}
    </Link>
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 items-end border-t border-line bg-sheet px-2 pb-[env(safe-area-inset-bottom)] lg:static lg:inset-auto lg:flex lg:w-60 lg:flex-col lg:gap-1 lg:border-t-0 lg:bg-transparent lg:p-4"
    >
      {plain(home)}
      {plain(path)}
      {plain(practice)}
      {plain(words)}

      <BoChatLauncher className={tabClass(false)} tour="lexa">
        <BoIcon />
        {t("nav.lexa")}
      </BoChatLauncher>

      {isAdmin && (
        <Link
          href="/admin"
          className="hidden min-h-12 items-center gap-3 rounded-full px-4 text-ink-faint hover:text-ink lg:flex"
        >
          <DashboardIcon />
          {t("nav.admin")}
        </Link>
      )}
    </nav>
  );
}
