"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { generatePendingCards } from "@/lib/generate-client";
import { normalizeWord, splitManualInput } from "@/features/words/clean";

/** Type any words you like (comma or new line between them); they join "my words" and get their cards made. */
export function QuickAddWords({ groups }: { groups: { id: string; name: string }[] }) {
  const { t } = useT();
  const router = useRouter();
  const [text, setText] = useState("");
  const [group, setGroup] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function add() {
    const words = [...new Set(splitManualInput(text).map(normalizeWord).filter((w): w is string => w !== null))];
    if (words.length === 0) {
      setFailed(true);
      setMessage(t("words.quickNone"));
      return;
    }
    setBusy(true);
    setFailed(false);
    setMessage(null);
    try {
      const groupName = groups.find((g) => g.id === group)?.name;
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words, groupName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setText("");
      setMessage(data.added > 0 ? t("words.quickAdded", { n: data.added }) : t("words.quickExists"));
      router.refresh();
      if (data.added > 0) {
        const generated = await generatePendingCards(data.added, () => undefined);
        if (generated.ok) router.refresh();
      }
    } catch {
      setFailed(true);
      setMessage(t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sheet space-y-3 rounded-[28px] p-5" aria-labelledby="quick-add-title">
      <div>
        <h2 id="quick-add-title" className="text-lg font-bold">{t("words.quickTitle")}</h2>
        <p className="text-sm text-ink-soft">{t("words.quickHint")}</p>
      </div>
      <label htmlFor="quick-words" className="sr-only">{t("words.quickTitle")}</label>
      <textarea
        id="quick-words"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={2}
        maxLength={1200}
        dir="ltr"
        placeholder="apple, borrow, take off"
        className="field ltr-text min-h-20 resize-y"
      />
      <div className="flex flex-wrap items-center gap-3">
        {groups.length > 0 && (
          <select value={group} onChange={(event) => setGroup(event.target.value)} className="field min-h-11 w-auto" aria-label={t("words.quickGroup")}>
            <option value="">{t("words.noGroup")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
        <button type="button" onClick={add} disabled={busy || text.trim() === ""} className="tag-btn min-h-11 text-sm disabled:opacity-50">
          {busy ? t("common.loading") : t("words.quickAdd")}
        </button>
        {message && (
          <p role="status" className={`text-sm ${failed ? "text-pen-red" : "text-leaf"}`}>{message}</p>
        )}
      </div>
    </section>
  );
}
