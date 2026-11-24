"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { AppSettings } from "@/lib/settings";

type LimitKey = "aiDailyLimitPerStudent" | "plusAiMultiplier" | "chatDailyFree" | "chatDailyPlus" | "chatMessagesPerConversation";
const FIELDS: LimitKey[] = ["aiDailyLimitPerStudent", "plusAiMultiplier", "chatDailyFree", "chatDailyPlus", "chatMessagesPerConversation"];

/** Edits the numbers that define the plans. Saves the whole settings object with only these keys changed. */
export function PlanLimitsForm({ settings }: { settings: AppSettings }) {
  const { t } = useT();
  const router = useRouter();
  const [values, setValues] = useState<Record<LimitKey, number>>(() => Object.fromEntries(FIELDS.map((key) => [key, settings[key]])) as Record<LimitKey, number>);
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");

  async function save() {
    setState("busy");
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, ...values }) });
      if (!response.ok) throw new Error("save");
      setState("done");
      router.refresh();
    } catch {
      setState("failed");
    }
  }

  return (
    <section className="sheet space-y-4 p-6" aria-labelledby="plan-limits">
      <h2 id="plan-limits" className="font-bold">{t("plans.limitsTitle")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((key) => (
          <label key={key} className="space-y-1 text-sm font-semibold">
            {t(`admin.field.${key}` as never)}
            <input
              type="number"
              min={0}
              className="field"
              value={values[key]}
              onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))}
            />
            <span className="block text-xs font-normal text-ink-faint">{t(`admin.help.${key}` as never)}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <TagButton onClick={() => void save()} disabled={state === "busy"}>{t("plans.save")}</TagButton>
        {state === "done" && <p role="status" className="font-semibold text-leaf">{t("plans.saved")}</p>}
        {state === "failed" && <p role="alert" className="pen-error">{t("common.error")}</p>}
      </div>
    </section>
  );
}

/** Extend or end one student's Plus. */
export function MemberActions({ id, active }: { id: string; active: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(body: object) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/memberships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
      if (response.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {[30, 90].map((days) => (
        <button key={days} type="button" disabled={busy} onClick={() => void run({ action: "extend", days })} className="min-h-10 rounded-full px-3 text-sm shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep disabled:opacity-50">
          {t("plans.extend", { n: days })}
        </button>
      ))}
      {active && (
        <button
          type="button"
          disabled={busy}
          onClick={() => window.confirm(t("plans.endConfirm")) && void run({ action: "end" })}
          className="min-h-10 rounded-full px-3 text-sm text-pen-red hover:bg-pen-red/10 disabled:opacity-50"
        >
          {t("plans.end")}
        </button>
      )}
    </div>
  );
}
