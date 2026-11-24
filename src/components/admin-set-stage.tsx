"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { STAGES, type Stage } from "@/features/stage/stage";

/** The admin changes a student's stage after checking with him. Students cannot do this themselves. */
export function AdminSetStage({ id, current }: { id: string; current: Stage | null }) {
  const { t } = useT();
  const router = useRouter();
  const [value, setValue] = useState<Stage | "">(current ?? "");
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");

  async function save() {
    if (!value) return;
    setState("busy");
    try {
      const response = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setStage", id, stage: value }) });
      if (!response.ok) throw new Error("stage");
      setState("done");
      router.refresh();
    } catch {
      setState("failed");
    }
  }

  return (
    <section className="sheet space-y-3 p-6" aria-labelledby="set-stage">
      <h2 id="set-stage" className="font-bold">{t("admin.stage.set")}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <select className="field w-auto min-w-48" value={value} onChange={(event) => setValue(event.target.value as Stage)} aria-label={t("admin.stage.set")}>
          {current === null && <option value="">—</option>}
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>{t(`stage.${stage}` as "stage.sec1")}</option>
          ))}
        </select>
        <button type="button" onClick={() => void save()} disabled={state === "busy" || !value} className="tag-btn min-h-11 text-sm disabled:opacity-50">{t("plans.save")}</button>
        {state === "done" && <p role="status" className="font-semibold text-leaf">{t("admin.stage.saved")}</p>}
        {state === "failed" && <p role="alert" className="pen-error">{t("common.error")}</p>}
      </div>
    </section>
  );
}
