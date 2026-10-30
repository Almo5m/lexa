"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BoMascot } from "@/components/bo-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

/** Starts a duel and opens it, ready to be shared. */
export function DuelStart() {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/duel", { method: "POST" });
      if (response.status === 429) return setError(t("duel.tooMany"));
      if (!response.ok) throw new Error("create");
      const { code } = await response.json();
      router.push(`/duel/${code}`);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hero-card space-y-4 p-6 text-center">
      <BoMascot mood="happy" size={110} className="mx-auto" />
      <h2 className="text-xl font-bold">{t("duel.introTitle")}</h2>
      <p className="opacity-90">{t("duel.introText")}</p>
      <TagButton onClick={() => void start()} disabled={busy} className="w-full justify-center sm:w-auto">{t("duel.start")}</TagButton>
      {error && <p role="alert" className="pen-error">{error}</p>}
    </div>
  );
}
