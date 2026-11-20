"use client";

import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import { HOOK_MAX, type HookCredit, type HookInfo } from "@/features/hooks/hooks";

/**
 * The memory hook of a word. His own hook comes first, then an approved one from another student (with the name),
 * then the AI's. Under it he can write or change his own, and optionally send it to be shared with his name.
 */
export function HookBlock({ aiHook, wordId, info }: { aiHook: string; wordId?: string; info?: HookInfo }) {
  const { t } = useT();
  const [mine, setMine] = useState(info?.mine ?? null);
  const [status, setStatus] = useState(info?.status ?? null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(info?.mine ?? "");
  const [share, setShare] = useState(false);
  const [credit, setCredit] = useState<HookCredit>("name");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function save(value: string) {
    if (!wordId) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, hook: value, share: share && value !== "", credit }),
      });
      if (!response.ok) throw new Error("hook_failed");
      const data: { hook: string | null; status: "pending" | null } = await response.json();
      setMine(data.hook);
      if (data.status) setStatus(data.status);
      if (!data.hook) setStatus(null);
      setText(data.hook ?? "");
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const shown = mine
    ? { title: t("hook.yours"), body: mine }
    : info?.shared
      ? { title: info.shared.author ? t("hook.from", { name: info.shared.author }) : t("hook.fromStudent"), body: info.shared.hook }
      : aiHook
        ? { title: t("card.hook"), body: aiHook }
        : null;

  return (
    <div className="space-y-2">
      {shown && (
        <div>
          <h3 className="font-semibold">{shown.title}</h3>
          <p className="text-ink-soft">{shown.body}</p>
        </div>
      )}
      {mine && status && <p className="text-sm text-ink-faint">{t(`hook.status.${status}` as "hook.status.pending")}</p>}
      {wordId && !editing && (
        <button type="button" className="min-h-11 text-sm font-semibold text-indigo" onClick={() => setEditing(true)}>
          {mine ? t("hook.edit") : t("hook.write")}
        </button>
      )}
      {wordId && editing && (
        <div className="space-y-3 rounded-md border border-line p-3">
          <textarea className="field" rows={2} maxLength={HOOK_MAX} value={text} onChange={(e) => setText(e.target.value)} aria-label={t("hook.write")} placeholder={t("hook.placeholder")} />
          <p className="text-xs text-ink-faint">{text.length}/{HOOK_MAX}</p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 size-5" checked={share} onChange={(e) => setShare(e.target.checked)} />
            <span>{t("hook.share")}</span>
          </label>
          {share && (
            <select className="field" value={credit} onChange={(e) => setCredit(e.target.value as HookCredit)} aria-label={t("hook.credit")}>
              <option value="name">{t("hook.credit.name")}</option>
              <option value="nick">{t("hook.credit.nick")}</option>
              <option value="anon">{t("hook.credit.anon")}</option>
            </select>
          )}
          {error && <p role="alert" className="text-sm text-pen-red">{t("hook.error")}</p>}
          <div className="flex flex-wrap gap-2">
            <TagButton disabled={busy || text.trim().length < 3} onClick={() => void save(text)}>{t("hook.save")}</TagButton>
            {mine && <TagButton quiet disabled={busy} onClick={() => void save("")}>{t("hook.remove")}</TagButton>}
            <TagButton quiet disabled={busy} onClick={() => setEditing(false)}>{t("hook.cancel")}</TagButton>
          </div>
        </div>
      )}
    </div>
  );
}
