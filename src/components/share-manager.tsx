"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

export function ShareManager({ activeUntil }: { activeUntil: string | null }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const untilText = activeUntil ? new Date(activeUntil).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : "";

  async function create() {
    setBusy(true);
    setFailed(false);
    setCopied(false);
    try {
      const response = await fetch("/api/share", { method: "POST" });
      if (!response.ok) throw new Error("share_failed");
      const data = await response.json();
      setLink(`${window.location.origin}/share/${data.token}`);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/share", { method: "DELETE" });
      if (!response.ok) throw new Error("revoke_failed");
      setLink(null);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">{t("share.what")}</p>
      <p className="text-sm text-ink-faint">{t("share.notShared")}</p>

      {link && (
        <div className="space-y-2 rounded-lg bg-paper-deep p-4">
          <p className="text-sm font-semibold">{t("share.copyHint")}</p>
          <input readOnly value={link} onFocus={(event) => event.currentTarget.select()} className="field ltr-text text-sm" aria-label={t("share.title")} />
          <TagButton quiet onClick={copy}>
            {copied ? t("share.copied") : t("share.copy")}
          </TagButton>
        </div>
      )}

      {activeUntil && !link && <p className="text-sm text-ink-soft">{t("share.active", { date: untilText })}</p>}

      <div className="flex flex-wrap gap-3">
        <TagButton gradient loading={busy} onClick={create}>
          {activeUntil ? t("share.renew") : t("share.create")}
        </TagButton>
        {activeUntil && (
          <TagButton quiet loading={busy} onClick={revoke}>
            {t("share.revoke")}
          </TagButton>
        )}
      </div>
      {failed && (
        <p role="alert" className="pen-error text-pen-red">
          {t("common.error")}
        </p>
      )}
    </div>
  );
}
