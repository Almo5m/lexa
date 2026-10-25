import { BoMark } from "@/components/bo-mark";
import Link from "next/link";
import type { Metadata } from "next";
import { AlmoSignature } from "@/components/almo-signature";
import { LandingDemo } from "@/components/landing-demo";
import { BoMascot } from "@/components/bo-mascot";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { setLanguage } from "@/app/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { absolute: t("land.title") },
    description: t("land.description"),
    openGraph: { title: t("land.title"), description: t("land.description"), type: "website" },
  };
}

const REASONS = ["1", "2", "3", "4"] as const;

export default async function WelcomePage() {
  const { user } = await getCurrentUser();
  if (user) redirect("/");
  const { lang, t } = await getT();
  const settings = await loadSettings();

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5">
      <header className="flex items-center justify-between gap-3 py-4">
        <Link href="/welcome" className="flex min-h-11 items-center gap-2">
          <BoMark size={44} />
          <span className="whitespace-nowrap text-2xl font-bold tracking-tight">{t("brand.app")}</span>
        </Link>
        <nav aria-label="Welcome" className="flex items-center gap-1 text-sm sm:gap-3">
          <form action={setLanguage.bind(null, lang === "ar" ? "en" : "ar")}>
            <button type="submit" className="min-h-11 px-2 text-ink-soft underline underline-offset-4">
              {t("nav.language")}
            </button>
          </form>
          <Link href="/login" className="flex min-h-11 items-center whitespace-nowrap px-2 font-semibold text-indigo">
            {t("land.haveAccount")}
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="grid items-center gap-8 py-10 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="space-y-5">
            <p className="inline-block rounded-full bg-paper-deep px-4 py-1.5 text-sm font-semibold text-indigo">
              {t("land.eyebrow")}
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">{t("land.heroTitle")}</h1>
            <p className="max-w-xl text-lg leading-8 text-ink-soft">{t("land.heroText")}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              {settings.demoEnabled && (
                <a href="#try" className="tag-btn tag-btn-grad">
                  {t("land.tryNow")}
                </a>
              )}
              <Link href="/signup" className={settings.demoEnabled ? "tag-btn tag-btn-quiet" : "tag-btn tag-btn-grad"}>
                {t("land.start")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <BoMascot mood="happy" size={260} />
          </div>
        </section>

        {settings.demoEnabled && (
          <section id="try" aria-labelledby="try-title" className="scroll-mt-6 py-8">
            <h2 id="try-title" className="mb-6 text-center text-2xl font-bold md:text-3xl">
              {t("land.demoTitle")}
            </h2>
            <LandingDemo />
          </section>
        )}

        <section aria-labelledby="why-title" className="py-12">
          <h2 id="why-title" className="mb-8 text-center text-2xl font-bold md:text-3xl">
            {t("land.whyTitle")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {REASONS.map((n) => (
              <li key={n} className="sheet flex items-start gap-4 p-6">
                <span aria-hidden className="grad-fill grid size-10 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white">{n}</span>
                <div>
                <h3 className="text-lg font-bold text-indigo">{t(`land.why${n}.title` as const)}</h3>
                <p className="mt-2 leading-7 text-ink-soft">{t(`land.why${n}.text` as const)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="name-title" className="py-8">
          <div className="hero-card p-8 text-center md:p-12">
            <h2 id="name-title" className="text-2xl font-bold md:text-3xl">
              {t("land.nameTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg leading-8">{t("land.nameText")}</p>
          </div>
        </section>

        <section aria-labelledby="final-title" className="flex flex-col items-center gap-4 py-14 text-center">
          <h2 id="final-title" className="text-2xl font-bold md:text-3xl">
            {t("land.finalTitle")}
          </h2>
          <p className="text-ink-soft">{t("land.finalText")}</p>
          <Link href="/signup" className="tag-btn tag-btn-grad">
            {t("land.start")}
          </Link>
        </section>
      </main>

      <p className="pb-2 text-center text-xs text-ink-faint">
        <a
          href="https://sketchfab.com/3d-models/futuristic-flying-animated-robot-low-poly-c5b92c281dc444448e64c0607719c7a2"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          {t("credits.bo")}
        </a>
      </p>
      <AlmoSignature />
    </div>
  );
}
