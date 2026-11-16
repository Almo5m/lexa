"use client";

import Link from "next/link";
import { BoMascot } from "@/components/bo-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

/** What a student sees when a page breaks: Bo, a way to try again, and a way home. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <BoMascot mood="neutral" size={130} />
      <h1 className="text-2xl font-bold">{t("error.title")}</h1>
      <p className="text-ink-soft">{t("error.text")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <TagButton onClick={reset}>{t("error.retry")}</TagButton>
        <Link href="/" className="tag-btn tag-btn-quiet">{t("nav.home")}</Link>
      </div>
    </main>
  );
}
