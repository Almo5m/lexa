"use client";

import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

/** The link of a duel, to copy or to send through the phone's share sheet. */
export function DuelShare({ code }: { code: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const link = () => `${window.location.origin}/duel/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the code is shown on screen, so it can still be read out */
    }
  }

  async function share() {
    try {
      await navigator.share({ title: t("duel.title"), text: t("duel.shareText"), url: link() });
    } catch {
      /* closed without sending */
    }
  }

  return (
    <section className="sheet space-y-3 p-4" aria-labelledby="duel-share">
      <h2 id="duel-share" className="font-bold">{t("duel.shareTitle")}</h2>
      <p className="ltr-text text-center text-3xl font-bold tracking-widest">{code}</p>
      <div className="flex flex-wrap gap-2">
        <TagButton quiet onClick={() => void copy()}>{copied ? t("duel.copied") : t("duel.copy")}</TagButton>
        {typeof navigator !== "undefined" && "share" in navigator && <TagButton onClick={() => void share()}>{t("duel.share")}</TagButton>}
      </div>
    </section>
  );
}
