"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StagePicker } from "@/components/stage-picker";
import { useT } from "@/lib/i18n/provider";
import type { Stage } from "@/features/stage/stage";

/** Lets a signed-in student choose or change his stage. Saves as soon as he picks. */
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

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{t("stage.title")}</h2>
      <p className="text-ink-soft">{t("stage.why")}</p>
      <StagePicker initial={initial} onPick={(stage) => void save(stage)} disabled={state === "busy"} />
      <p aria-live="polite" className="min-h-5 text-sm">
        {state === "saved" && <span className="text-leaf">{t("stage.saved")}</span>}
        {state === "error" && <span className="text-pen-red">{t("common.error")}</span>}
      </p>
    </div>
  );
}
