import Link from "next/link";
import { AlmoSignature } from "@/components/almo-signature";
import type { LegalPage } from "@/features/legal/content";
import { getT } from "@/lib/i18n/server";

/** A plain, readable page for the privacy policy or the terms. Open to everyone, no login. */
export async function LegalView({ page }: { page: LegalPage }) {
  const { t } = await getT();
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <main className="mx-auto max-w-2xl space-y-6 px-5 py-10">
        <Link href="/welcome" className="inline-flex min-h-11 items-center text-ink-soft transition-colors hover:text-indigo">‹ {t("nav.home")}</Link>
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <p className="text-sm text-ink-soft">{page.updated}</p>
        {page.sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-xl font-bold">{section.title}</h2>
            {section.lines.map((line) => (
              <p key={line} className="leading-8">{line}</p>
            ))}
          </section>
        ))}
      </main>
      <AlmoSignature />
    </div>
  );
}
