"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

/** Gives one student some days of Plus by hand (a gift, a prize, a paid order handled outside the app). */
export function GrantPlus({ id }: { id: string }) {
  const { t } = useT();
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");

  async function grant() {
    setState("busy");
    try {
      const response = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "grantPlus", id, days }) });
      if (!response.ok) throw new Error("grant");
      setState("done");
      router.refresh();
    } catch {
      setState("failed");
    }
  }

  return (
    <section className="sheet space-y-3 p-6" aria-labelledby="grant-plus">
      <h2 id="grant-plus" className="font-bold">{t("codes.grantTitle")}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm font-semibold">{t("codes.days")}<input type="number" min={1} max={400} className="field w-28" value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
        <TagButton onClick={() => void grant()} disabled={state === "busy"}>{t("codes.grant")}</TagButton>
      </div>
      {state === "done" && <p role="status" className="font-semibold text-leaf">{t("codes.granted")}</p>}
      {state === "failed" && <p role="alert" className="pen-error">{t("common.error")}</p>}
    </section>
  );
}
