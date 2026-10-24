"use client";

import { useRef, useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";

interface Counts {
  total: number;
  ready: number;
  reviewed: number;
}

/**
 * Makes the finished cards for the whole path. Each click asks the server for a few cards at a time and goes on
 * until none are missing, so it can be stopped and started again at any point without losing anything.
 */
export function AdminPathCards({ initial, keySet }: { initial: Counts; keySet: boolean }) {
  const { t } = useT();
  const [counts, setCounts] = useState(initial);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const stopRef = useRef(false);

  async function run() {
    stopRef.current = false;
    setRunning(true);
    setMessage(null);
    try {
      while (!stopRef.current) {
        const response = await fetch("/api/admin/path-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setMessage(t("admin.cards.failed", { error: String(data.error ?? response.status) }));
          return;
        }
        const missing = data.remaining as number;
        setCounts((previous) => ({ ...previous, ready: previous.total - Math.max(missing, 0) }));
        if (missing <= 0) {
          setMessage(t("admin.cards.finished"));
          return;
        }
        if (data.saved === 0) {
          setMessage(t("admin.cards.skipped", { words: (data.skipped as string[]).join(", ") }));
          return;
        }
      }
      setMessage(t("admin.cards.stopped"));
    } catch {
      setMessage(t("common.error"));
    } finally {
      setRunning(false);
    }
  }

  const percent = counts.total === 0 ? 0 : Math.round((counts.ready / counts.total) * 100);

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("admin.cards.intro")}</p>

      <section className="sheet space-y-4 p-6" aria-labelledby="cards-title">
        <h2 id="cards-title" className="text-lg font-bold">
          {t("admin.cards.title")}
        </h2>
        <p className="text-2xl font-bold">
          {counts.ready} / {counts.total}
          <span className="ms-2 text-base font-normal text-ink-soft">{t("admin.cards.ready")}</span>
        </p>
        <div className="h-3 overflow-hidden rounded-full bg-paper-deep" role="progressbar" aria-valuemin={0} aria-valuemax={counts.total} aria-valuenow={counts.ready} aria-label={t("admin.cards.title")}>
          <div className="grad-fill h-3 rounded-full" style={{ width: `${counts.ready === 0 ? 0 : Math.max(3, percent)}%` }} />
        </div>
        <div className="flex flex-wrap gap-3">
          {running ? (
            <TagButton onClick={() => (stopRef.current = true)} quiet>
              {t("admin.cards.stop")}
            </TagButton>
          ) : (
            <TagButton onClick={run} disabled={!keySet || counts.ready >= counts.total} gradient>
              {counts.ready === 0 ? t("admin.cards.start") : t("admin.cards.resume")}
            </TagButton>
          )}
          <a href="/api/admin/path-cards?format=csv" className="tag-btn tag-btn-quiet" download>
            {t("admin.cards.csv")}
          </a>
        </div>
        {running && <p role="status">{t("admin.cards.running")}</p>}
        {message && <p role="status">{message}</p>}
        {!keySet && <p className="text-pen-red">{t("admin.keyMissing")}</p>}
      </section>
    </div>
  );
}
