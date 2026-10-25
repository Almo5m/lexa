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
    `flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-xs md:min-h-12 md:flex-row md:justify-start md:gap-3 md:rounded-full md:px-4 md:text-base ${
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
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 items-end border-t border-line bg-sheet px-2 pb-[env(safe-area-inset-bottom)] md:static md:inset-auto md:flex md:w-60 md:flex-col md:gap-1 md:border-t-0 md:bg-transparent md:p-4"
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
          className="hidden min-h-12 items-center gap-3 rounded-full px-4 text-ink-faint hover:text-ink md:flex"
        >
          <DashboardIcon />
          {t("nav.admin")}
        </Link>
      )}
    </nav>
  );
}
