"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

export interface Batch {
  label: string;
  days: number;
  total: number;
  used: number;
  revoked: number;
  unused: string[];
}

function download(name: string, codes: string[]) {
  const blob = new Blob([`code\r\n${codes.join("\r\n")}\r\n`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Make a batch of Plus codes, download them, and cancel the unused ones of a batch. */
export function AdminCodes({ batches }: { batches: Batch[] }) {
  const { t } = useT();
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [count, setCount] = useState(20);
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(body: object): Promise<{ codes?: string[] } | null> {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/plus-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error("codes");
      router.refresh();
      return await response.json();
    } catch {
      setError(t("common.error"));
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("codes.intro")}</p>
      <section className="sheet space-y-3 p-6" aria-labelledby="codes-new">
        <h2 id="codes-new" className="text-lg font-bold">{t("codes.new")}</h2>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await call({ action: "generate", label, count, days });
            if (result?.codes) {
              download(`plus-${label.replace(/[^\w-]+/g, "_")}.csv`, result.codes);
              setLabel("");
            }
          }}
        >
          <input className="field" required maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("codes.label")} aria-label={t("codes.label")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">{t("codes.count")}<input type="number" min={1} max={200} required className="field" value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
            <label className="space-y-1 text-sm font-semibold">{t("codes.days")}<input type="number" min={1} max={400} required className="field" value={days} onChange={(e) => setDays(Number(e.target.value))} /></label>
          </div>
          <p className="text-sm text-ink-soft">{t("codes.once")}</p>
          <TagButton type="submit" gradient disabled={busy}>{t("codes.make")}</TagButton>
          {error && <p role="alert" className="pen-error">{error}</p>}
        </form>
      </section>

      {batches.length === 0 && <p className="text-ink-soft">{t("codes.empty")}</p>}
      <ul className="space-y-3">
        {batches.map((batch) => (
          <li key={batch.label} className="sheet space-y-2 p-5">
            <p className="font-bold">{batch.label}</p>
            <p className="text-sm text-ink-soft">{t("codes.stats", { days: batch.days, total: batch.total, used: batch.used, left: batch.unused.length, revoked: batch.revoked })}</p>
            <div className="flex flex-wrap gap-1 border-t border-line pt-2 text-sm">
              <button type="button" disabled={batch.unused.length === 0} className="min-h-11 px-3 font-semibold text-indigo disabled:opacity-40" onClick={() => download(`plus-${batch.label.replace(/[^\w-]+/g, "_")}-unused.csv`, batch.unused)}>{t("codes.download")}</button>
              <button type="button" disabled={busy || batch.unused.length === 0} className="min-h-11 px-3 text-pen-red disabled:opacity-40" onClick={() => void call({ action: "revokeBatch", label: batch.label })}>{t("codes.revoke")}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
