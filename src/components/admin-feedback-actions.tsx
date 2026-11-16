"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

/** Mark a student's message as handled, or delete it. */
export function FeedbackActions({ id, done }: { id: string; done: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(body: object) {
    setBusy(true);
    try {
      await fetch("/api/admin/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1 border-t border-line pt-2 text-sm">
      <button type="button" disabled={busy} className="min-h-11 px-3 font-semibold text-indigo" onClick={() => void run({ action: "done", id, done: !done })}>
        {done ? t("feedback.admin.reopen") : t("feedback.admin.done")}
      </button>
      <button type="button" disabled={busy} className="min-h-11 px-3 text-pen-red" onClick={() => void run({ action: "delete", id })}>
        {t("school.admin.deleteWord")}
      </button>
    </div>
  );
}
