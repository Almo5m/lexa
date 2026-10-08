import Link from "next/link";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { AlmoSignature } from "@/components/almo-signature";
import { FlameIcon, XpIcon } from "@/components/icons";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { setLanguage, signOut } from "@/app/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await requireUserPage();
  const { lang, t } = await getT();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, total_xp, streak_current")
    .eq("id", user.id)
    .single();

  const streak = profile?.streak_current ?? 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col md:flex-row">
      <aside className="md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:justify-between md:py-6">
        <div>
          <Link href="/" className="hidden items-center gap-3 px-6 pb-4 md:flex">
            <img src="/lexa/owl.webp" alt="" width={46} height={39} />
            <span className="text-2xl font-bold tracking-tight">Lexa</span>
          </Link>
          <AppNav isAdmin={profile?.role === "admin"} />
        </div>
        <div className="hidden gap-4 px-6 text-sm md:flex">
          <form action={setLanguage.bind(null, lang === "ar" ? "en" : "ar")}>
            <button type="submit" className="min-h-11 text-ink-soft underline underline-offset-4">
              {t("nav.language")}
            </button>
          </form>
          <form action={signOut}>
            <button type="submit" className="min-h-11 text-ink-soft underline underline-offset-4">
              {t("nav.logout")}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
        <header className="flex items-center justify-between gap-3 px-5 pt-4 md:justify-end md:px-8 md:pt-6">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <img src="/lexa/owl.webp" alt="" width={40} height={34} />
            <span className="text-xl font-bold tracking-tight">Lexa</span>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-sheet px-3 py-1.5 text-sm font-semibold shadow-[var(--shadow-1)]"
              aria-label={`${streak}`}
            >
              <FlameIcon active={streak > 0} width={20} height={20} />
              {streak}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-sheet px-3 py-1.5 text-sm font-semibold shadow-[var(--shadow-1)]"
              aria-label={`XP ${profile?.total_xp ?? 0}`}
            >
              <XpIcon width={20} height={20} />
              {profile?.total_xp ?? 0}
            </span>
            <details className="relative md:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-sheet text-lg shadow-[var(--shadow-1)]">
                <span aria-hidden="true">⋯</span>
                <span className="sr-only">{t("nav.language")} / {t("nav.logout")}</span>
              </summary>
              <div className="absolute end-0 z-30 mt-2 w-44 rounded-[var(--r-md)] bg-sheet p-2 shadow-[var(--shadow-2)]">
                <form action={setLanguage.bind(null, lang === "ar" ? "en" : "ar")}>
                  <button type="submit" className="min-h-11 w-full rounded-lg px-3 text-start hover:bg-paper-deep">
                    {t("nav.language")}
                  </button>
                </form>
                <form action={signOut}>
                  <button type="submit" className="min-h-11 w-full rounded-lg px-3 text-start hover:bg-paper-deep">
                    {t("nav.logout")}
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main className="flex-1 px-5 pt-5 md:px-8 md:pt-6">{children}</main>
        <AlmoSignature />
      </div>
    </div>
  );
}
