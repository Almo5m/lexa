"use client";

import { fetchAi } from "@/lib/fetch-ai";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { RichText } from "@/components/rich-text";
import { TagButton } from "@/components/tag-button";
import { WordCardView } from "@/components/word-card-view";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { WordCard } from "@/features/ai/schemas";

interface SentenceResult {
  correct: boolean;
  correctedVersion: string;
  explanationAr: string;
}

const ERRORS: Record<string, DictKey> = {
  demo_limit_visitor: "land.err.visitor",
  demo_closed: "land.err.closed",
  demo_limit_total: "land.err.closed",
  ai_busy: "land.err.busy",
  ai_unavailable: "land.err.closed",
  invalid_input: "land.err.word",
};

/** The try-before-signup demo: type a word, get a real card, write a sentence, get checked. No account needed. */
export function LandingDemo() {
  const { t } = useT();
  const [word, setWord] = useState("");
  const [card, setCard] = useState<WordCard | null>(null);
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<SentenceResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<DictKey | null>(null);

  async function post<T>(url: string, body: unknown): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      const response = await fetchAi(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(ERRORS[data.error] ?? "land.err.generic");
        return null;
      }
      return data as T;
    } catch {
      setError("land.err.generic");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function getCard(event: FormEvent) {
    event.preventDefault();
    const data = await post<{ card: WordCard }>("/api/demo/card", { word: word.trim() });
    if (data) {
      setCard(data.card);
      setResult(null);
      setSentence("");
    }
  }

  async function check(event: FormEvent) {
    event.preventDefault();
    if (!card) return;
    const data = await post<SentenceResult>("/api/demo/sentence", { word: card.term, sentence: sentence.trim() });
    if (data) setResult(data);
  }

  function reset() {
    setCard(null);
    setResult(null);
    setSentence("");
    setWord("");
    setError(null);
  }

  return (
    <div className="sheet-raised mx-auto max-w-2xl space-y-6 p-5 md:p-8">
      {!card ? (
        <form onSubmit={getCard} className="space-y-4">
          <label htmlFor="demo-word" className="block text-lg font-semibold">
            {t("land.demoStep1")}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="demo-word"
              value={word}
              onChange={(event) => setWord(event.target.value)}
              placeholder={t("land.demoPlaceholder")}
              maxLength={30}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="field ltr-text flex-1 text-xl"
            />
            <TagButton type="submit" gradient loading={busy} disabled={word.trim().length < 2}>
              {t("land.demoGetCard")}
            </TagButton>
          </div>
        </form>
      ) : (
        <>
          <WordCardView key={card.term} card={card} startRevealed />

          {!result ? (
            <form onSubmit={check} className="space-y-4">
              <label htmlFor="demo-sentence" className="block text-lg font-semibold">
                {t("land.demoStep2", { word: card.term })}
              </label>
              <input
                id="demo-sentence"
                value={sentence}
                onChange={(event) => setSentence(event.target.value)}
                placeholder={t("land.demoSentencePlaceholder")}
                maxLength={200}
                autoComplete="off"
                spellCheck={false}
                className="field ltr-text text-xl"
              />
              <TagButton type="submit" gradient loading={busy} disabled={sentence.trim().length < 2}>
                {t("land.demoCheck")}
              </TagButton>
            </form>
          ) : (
            <div className="space-y-4" aria-live="polite">
              <p className={`font-semibold ${result.correct ? "text-leaf" : "text-pen-red"}`}>
                {result.correct ? t("land.demoRight") : t("land.demoWrong")}
              </p>
              <div className="space-y-2 rounded-lg border border-line bg-paper-deep p-4">
                <RichText text={result.explanationAr} />
                {result.correctedVersion && (
                  <p className="ltr-text text-ink-soft">
                    <span className="text-sm text-ink-faint">{t("land.demoFixed")} </span>
                    {result.correctedVersion}
                  </p>
                )}
              </div>
              <div className="hero-card p-5">
                <p className="text-lg font-bold">{t("land.demoAfterTitle")}</p>
                <p className="mt-1 opacity-95">{t("land.demoAfterText")}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/signup" className="tag-btn">
                    {t("land.start")}
                  </Link>
                  <TagButton quiet onClick={reset}>
                    {t("land.demoAnother")}
                  </TagButton>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="pen-error text-pen-red">
          {t(error)}
          {(error === "land.err.visitor" || error === "land.err.closed") && (
            <>
              {" "}
              <Link href="/signup" className="font-semibold text-indigo hover:opacity-80">
                {t("land.start")}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
