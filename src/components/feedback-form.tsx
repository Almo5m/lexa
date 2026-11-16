"use client";

import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import type { DictKey } from "@/lib/i18n/dictionary";
import { useT } from "@/lib/i18n/provider";

const KINDS = ["bug", "idea", "question"] as const;

/** A student writes to the admin: something broken, an idea, or a question. */
export function FeedbackForm() {
  const { t } = useT();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("bug");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "many" | "failed">("idle");

  async function send() {
    setState("busy");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, message }) });
      if (response.status === 429) return setState("many");
      if (!response.ok) throw new Error("send");
      setMessage("");
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  return (
    <form className="sheet space-y-4 p-6" onSubmit={(event) => { event.preventDefault(); void send(); }}>
      <fieldset className="space-y-2">
        <legend className="font-semibold">{t("feedback.kind")}</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((item) => (
            <button key={item} type="button" aria-pressed={kind === item} onClick={() => setKind(item)} className={`choice !w-auto min-h-11 px-4 ${kind === item ? "choice-picked" : ""}`}>
              {t(`feedback.kind.${item}` as DictKey)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1 font-semibold">
        {t("feedback.message")}
        <textarea className="field" rows={5} required minLength={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      <p className="text-sm text-ink-soft">{t("feedback.note")}</p>
      <TagButton type="submit" gradient disabled={state === "busy" || message.trim().length < 3}>{t("feedback.send")}</TagButton>
      {state === "sent" && <p role="status" className="font-semibold text-leaf">{t("feedback.sent")}</p>}
      {state === "many" && <p role="alert" className="pen-error">{t("feedback.many")}</p>}
      {state === "failed" && <p role="alert" className="pen-error">{t("common.error")}</p>}
    </form>
  );
}
