"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";

/** Approve, reject or delete one student hook. */
export function HookActions({ id, status }: { id: string; status: string }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: "approve" | "reject" | "delete") {
    setBusy(true);
    try {
      await fetch("/api/admin/hooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1 border-t border-line pt-2 text-sm">
      {status !== "approved" && <button type="button" disabled={busy} className="min-h-11 px-3 font-semibold text-indigo" onClick={() => void run("approve")}>{t("hooks.admin.approve")}</button>}
      {status !== "rejected" && <button type="button" disabled={busy} className="min-h-11 px-3 text-ink-soft" onClick={() => void run("reject")}>{t("hooks.admin.reject")}</button>}
      <button type="button" disabled={busy} className="min-h-11 px-3 text-pen-red" onClick={() => window.confirm(t("admin.confirmDelete")) && void run("delete")}>{t("school.admin.deleteWord")}</button>
    </div>
  );
}
