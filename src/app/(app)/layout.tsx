import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { AlmoSignature } from "@/components/almo-signature";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { setLanguage, signOut } from "@/app/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await requireUserPage();
  const { lang, t } = await getT();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col md:flex-row">
      <aside className="md:sticky md:top-0 md:h-dvh md:shrink-0">
        <div className="flex items-center justify-between px-5 pt-4 md:flex-col md:items-start md:gap-4 md:pt-8">
          <span className="text-2xl font-semibold tracking-tight">Lexa</span>
          <div className="flex gap-4 text-sm">
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
        </div>
        <AppNav isAdmin={profile?.role === "admin"} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="flex-1 px-5 pt-6 md:px-8 md:pt-10">{children}</main>
        <AlmoSignature />
      </div>
    </div>
  );
}
