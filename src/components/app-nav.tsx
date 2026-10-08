"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  AddIcon,
  CameraIcon,
  DashboardIcon,
  HomeIcon,
  LexaIcon,
  PracticeIcon,
  WordsIcon,
} from "@/components/icons";
import { LexaChatLauncher } from "@/components/lexa-chat-sheet";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface NavLink {
  href: string;
  label: DictKey;
  icon: ReactNode;
  also?: string[];
}

const PRACTICE_PATHS = ["/review", "/quiz", "/translate", "/level", "/suggest"];

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useT();

  const isActive = (link: NavLink) =>
    link.href === "/"
      ? pathname === "/"
      : [link.href, ...(link.also ?? [])].some((prefix) => pathname.startsWith(prefix));

  const home: NavLink = { href: "/", label: "nav.home", icon: <HomeIcon /> };
  const words: NavLink = { href: "/words", label: "nav.words", icon: <WordsIcon /> };
  const practice: NavLink = { href: "/practice", label: "nav.practice", icon: <PracticeIcon />, also: PRACTICE_PATHS };
  const add: NavLink = { href: "/add", label: "nav.add", icon: <CameraIcon /> };

  const tabClass = (active: boolean) =>
    `flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-xs md:min-h-12 md:flex-row md:justify-start md:gap-3 md:rounded-full md:px-4 md:text-base ${
      active ? "font-semibold text-indigo md:bg-paper-deep" : "text-ink-faint hover:text-ink"
    }`;

  const plain = (link: NavLink) => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={isActive(link) ? "page" : undefined}
      className={tabClass(isActive(link))}
    >
      {link.icon}
      {t(link.label)}
    </Link>
  );

  const addActive = isActive(add);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 items-end border-t border-line bg-sheet px-2 pb-[env(safe-area-inset-bottom)] md:static md:inset-auto md:flex md:w-60 md:flex-col md:gap-1 md:border-t-0 md:bg-transparent md:p-4"
    >
      {plain(home)}
      {plain(words)}

      <Link
        href={add.href}
        aria-current={addActive ? "page" : undefined}
        className="-mt-5 flex flex-col items-center gap-1 text-xs font-semibold text-indigo md:mt-0 md:flex-row md:gap-3 md:rounded-full md:px-4 md:py-2 md:text-base"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--grad)] text-white shadow-[0_5px_0_#2a5fc2,0_10px_20px_rgba(61,144,251,0.35)] md:h-11 md:w-11 md:shadow-[0_3px_0_#2a5fc2]">
          <AddIcon width={28} height={28} />
        </span>
        {t(add.label)}
      </Link>

      {plain(practice)}

      <LexaChatLauncher className={tabClass(false)}>
        <LexaIcon />
        {t("nav.lexa")}
      </LexaChatLauncher>

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
