"use client";

import Link from "next/link";
import { useState } from "react";
import { LexaLoader } from "@/components/lexa-loader";
import { LexaMascot } from "@/components/lexa-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

type Stage = "intro" | "test" | "saving" | "result";

export function LevelTest({ words }: { words: string[] }) {
  const { t } = useT();
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ word: string; known: boolean }[]>([]);
  const [result, setResult] = useState<{ level: number; reliable: boolean } | null>(null);
  const [error, setError] = useState(false);

  function restart() {
    setStage("intro");
    setIndex(0);
    setAnswers([]);
    setResult(null);
    setError(false);
  }

  async function answer(known: boolean) {
    const next = [...answers, { word: words[index], known }];
    setAnswers(next);
    if (index + 1 < words.length) return setIndex(index + 1);

    setStage("saving");
    setError(false);
    try {
      const response = await fetch("/api/level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: next }),
      });
      if (!response.ok) throw new Error("level_failed");
      setResult(await response.json());
      setStage("result");
    } catch {
      setError(true);
      setStage("test");
      setAnswers(next.slice(0, -1));
    }
  }

  if (stage === "intro") {
    return (
      <div className="sheet max-w-xl space-y-5 p-6">
        <p className="leading-8">{t("level.intro")}</p>
        <TagButton onClick={() => setStage("test")}>{t("level.start")}</TagButton>
      </div>
    );
  }

  if (stage === "saving") {
    return (
      <div className="sheet flex max-w-xl flex-col items-center gap-3 p-8 text-center" aria-live="polite">
        <LexaLoader size={150} label={t("common.loading")} />
      </div>
    );
  }

  if (stage === "result" && result) {
    return (
      <div className="sheet max-w-xl space-y-5 p-6" aria-live="polite">
        {result.reliable ? (
          <>
            <LexaMascot mood="happy" size={140} />
            <h2 className="marker px-1 text-2xl font-semibold">{t("level.resultTitle", { n: result.level })}</h2>
            <p className="text-lg">{t(`level.name.${result.level}` as DictKey)}</p>
            <Link href="/suggest" className="tag-btn">
              {t("level.seeSuggestions")}
            </Link>
          </>
        ) : (
          <>
            <LexaMascot mood="neutral" size={140} />
            <p className="pen-error text-pen-red">{t("level.unreliable")}</p>
            <TagButton onClick={restart}>{t("level.retake")}</TagButton>
          </>
        )}
      </div>
    );
  }

  return (
    <section className="sheet max-w-xl space-y-8 p-6" aria-live="polite">
      <p className="text-sm text-ink-faint">{t("level.progress", { a: index + 1, b: words.length })}</p>
      <p className="ltr-text text-5xl font-semibold tracking-tight">{words[index]}</p>
      <div className="flex flex-wrap gap-3">
        <TagButton onClick={() => answer(true)}>{t("level.know")}</TagButton>
        <TagButton quiet onClick={() => answer(false)}>
          {t("level.dontKnow")}
        </TagButton>
      </div>
      {error && (
        <p role="alert" className="pen-error text-pen-red">
          {t("level.error")}
        </p>
      )}
    </section>
  );
}
