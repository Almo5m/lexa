"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StagePicker } from "@/components/stage-picker";
import { useT } from "@/lib/i18n/provider";
import type { Stage } from "@/features/stage/stage";

/** Lets a student who never chose a stage choose it once. After that it is shown read-only; the admin changes it. */
export function StageForm({ initial }: { initial: Stage | null }) {
  const { t } = useT();
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "saved" | "error">("idle");

  async function save(stage: Stage) {
    setState("busy");
    try {
      const response = await fetch("/api/profile/stage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) });
      if (!response.ok) throw new Error("stage_failed");
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (initial !== null) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">{t("stage.title")}</h2>
        <p className="rounded-2xl bg-paper-deep px-4 py-3 text-lg font-semibold">{t(`stage.${initial}` as "stage.sec1")}</p>
        <p className="text-ink-soft">{t("stage.locked")}</p>
        <Link href="/feedback" className="tag-btn tag-btn-quiet">{t("stage.contact")}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{t("stage.title")}</h2>
      <p className="text-ink-soft">{t("stage.chooseOnce")}</p>
      <StagePicker initial={initial} onPick={(stage) => void save(stage)} disabled={state === "busy"} />
      <p aria-live="polite" className="min-h-5 text-sm">
        {state === "saved" && <span className="text-leaf">{t("stage.saved")}</span>}
        {state === "error" && <span className="text-pen-red">{t("common.error")}</span>}
      </p>
    </div>
  );
}
