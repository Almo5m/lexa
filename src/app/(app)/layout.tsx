import { BoMark } from "@/components/bo-mark";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { AlmoSignature } from "@/components/almo-signature";
import { BoCompanionProvider } from "@/components/bo-companion";
import { TourReplayButton } from "@/components/bo-guide";
import { FlameIcon, XpIcon } from "@/components/icons";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { setLanguage, signOut } from "@/app/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await requireUserPage();
  const { lang, t } = await getT();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, total_xp, streak_current, display_name")
    .eq("id", user.id)
    .single();

  const streak = profile?.streak_current ?? 0;

  return (
    <BoCompanionProvider userId={user.id} name={profile?.display_name ?? ""}>
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col lg:flex-row">
      <aside className="lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between lg:py-6">
        <div>
          <Link href="/" className="hidden items-center gap-3 px-6 pb-4 lg:flex">
            <BoMark size={46} />
            <span className="text-2xl font-bold tracking-tight">{t("brand.app")}</span>
          </Link>
          <AppNav isAdmin={profile?.role === "admin"} />
        </div>
        <div className="hidden flex-wrap gap-x-4 px-6 text-sm lg:flex">
          <Link href="/me" className="flex min-h-11 items-center text-ink-soft transition-colors hover:text-indigo">
            {t("me.link")}
          </Link>
          <TourReplayButton className="min-h-11 text-ink-soft transition-colors hover:text-indigo" />
          <form action={setLanguage.bind(null, lang === "ar" ? "en" : "ar")}>
            <button type="submit" className="min-h-11 text-ink-soft transition-colors hover:text-indigo">
              {t("nav.language")}
            </button>
          </form>
          <form action={signOut}>
            <button type="submit" className="min-h-11 text-ink-soft transition-colors hover:text-indigo">
              {t("nav.logout")}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-40 lg:pb-0">
        <header className="mx-auto flex w-full max-w-3xl lg:max-w-5xl items-center justify-between gap-3 px-5 pt-4 lg:justify-end md:px-8 lg:pt-6">
          <Link href="/" className="flex min-h-11 items-center gap-2 lg:hidden">
            <BoMark size={36} />
            <span className="whitespace-nowrap text-lg font-bold tracking-tight">{t("brand.app")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span data-tour="progress" className="flex items-center gap-2">
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
            </span>
            <details className="relative lg:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-sheet text-lg shadow-[var(--shadow-1)]">
                <span aria-hidden="true">⋯</span>
                <span className="sr-only">{t("nav.language")} / {t("nav.logout")}</span>
              </summary>
              <div className="absolute end-0 z-30 mt-2 w-44 rounded-[var(--r-md)] bg-sheet p-2 shadow-[var(--shadow-2)]">
                <Link href="/me" className="flex min-h-11 w-full items-center rounded-lg px-3 hover:bg-paper-deep">
                  {t("me.link")}
                </Link>
                <TourReplayButton className="min-h-11 w-full rounded-lg px-3 text-start hover:bg-paper-deep" />
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
        <main className="flex-1 px-5 pt-5 md:px-8 lg:pt-6 [&>*]:mx-auto">{children}</main>
        <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">
          <AlmoSignature />
        </div>
      </div>
    </div>
    </BoCompanionProvider>
  );
}
