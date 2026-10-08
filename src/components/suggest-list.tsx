"use client";

import Link from "next/link";
import { useState } from "react";
import { LexaLoader } from "@/components/lexa-loader";
import { LexaMascot } from "@/components/lexa-mascot";
import { TagButton } from "@/components/tag-button";
import { generatePendingCards } from "@/lib/generate-client";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

export function SuggestList({ words }: { words: string[] }) {
  const { t } = useT();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<"pick" | "saving" | "done">("pick");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  function toggle(word: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  async function add() {
    setError(null);
    setStage("saving");
    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: [...selected], groupName: t("suggest.group") }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error);
      const generated = await generatePendingCards(saved.added, (done, total) => setProgress({ done, total }));
      if (!generated.ok) throw new Error(generated.error);
      setStage("done");
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "";
      const known = ["daily_ai_limit_reached", "ai_feature_disabled", "ai_busy"];
      setError(known.includes(code) ? t(`error.${code}` as DictKey) : t("error.generic"));
      setStage("pick");
    }
  }

  if (stage === "saving") {
    return (
      <div className="sheet flex max-w-xl flex-col items-center gap-3 p-8 text-center" aria-live="polite">
        <LexaLoader size={150} label={t("common.loading")} />
        <p className="text-lg">
          {progress.total === 0 ? t("add.saving") : t("add.generating", { a: progress.done, b: progress.total })}
        </p>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="sheet flex max-w-xl flex-col items-center gap-4 p-8 text-center">
        <LexaMascot mood="happy" size={150} />
        <p className="marker px-1 text-xl">{t("add.done", { n: progress.done })}</p>
        <div>
          <Link href="/words" className="tag-btn">
            {t("add.openWords")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex gap-4 text-sm">
        <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setSelected(new Set(words))}>
          {t("suggest.selectAll")}
        </button>
        <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setSelected(new Set())}>
          {t("suggest.clear")}
        </button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {words.map((word) => (
          <li key={word}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-line px-1">
              <input
                type="checkbox"
                checked={selected.has(word)}
                onChange={() => toggle(word)}
                className="h-6 w-6 accent-[var(--color-indigo)]"
              />
              <span className="ltr-text text-lg">{word}</span>
            </label>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="pen-error text-pen-red">
          {error}
        </p>
      )}

      <TagButton onClick={add} disabled={selected.size === 0}>
        {t("suggest.add", { n: selected.size })}
      </TagButton>
    </div>
  );
}
