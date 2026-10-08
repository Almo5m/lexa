"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { LexaLoader } from "@/components/lexa-loader";
import { LexaMascot } from "@/components/lexa-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface Exercise {
  wordId: string;
  term: string;
  direction: "ar2en" | "en2ar";
  source: string;
  reference: string;
  hintAr: string;
}

interface Feedback {
  verdict: "correct" | "almost" | "wrong";
  correctedVersion: string;
  naturalVersion: string;
  explanationAr: string;
  xpGained: number;
}

const KNOWN_ERRORS = ["daily_ai_limit_reached", "ai_feature_disabled", "ai_busy", "no_words"];

export function TranslateSession() {
  const { t } = useT();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const combo = useRef(0);
  const totals = useRef({ xp: 0, good: 0 });

  function describe(code: string | undefined) {
    return KNOWN_ERRORS.includes(code ?? "")
      ? t(`error.${code}` as DictKey)
      : t("error.generic");
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/translate/generate", { method: "POST" });
      const data = await response.json();
      if (!response.ok) return setError(describe(data.error));
      setExercises(data.exercises);
      setIndex(0);
      totals.current = { xp: 0, good: 0 };
      combo.current = 0;
    } catch {
      setError(t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (!exercises || !answer.trim()) return;
    const exercise = exercises[index];
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/translate/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: exercise.wordId,
          direction: exercise.direction,
          source: exercise.source,
          answer,
          combo: combo.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) return setError(describe(data.error));
      totals.current.xp += data.xpGained;
      if (data.correct) {
        totals.current.good += 1;
        combo.current += 1;
      } else {
        combo.current = 0;
      }
      setFeedback(data);
    } catch {
      setError(t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setIndex((value) => value + 1);
    setAnswer("");
    setShowHint(false);
    setFeedback(null);
    setError(null);
  }

  if (!exercises) {
    return (
      <div className="sheet max-w-xl space-y-5 p-6">
        <p className="leading-8">{t("translate.intro")}</p>
        {error && (
          <p role="alert" className="pen-error text-pen-red">
            {error}
          </p>
        )}
        <TagButton onClick={start} loading={busy}>
          {t("translate.start")}
        </TagButton>
        {busy && (
          <div className="flex flex-col items-center gap-2 pt-2 text-center" aria-live="polite">
            <LexaLoader size={130} label={t("translate.generating")} />
            <p className="text-ink-soft">{t("translate.generating")}</p>
          </div>
        )}
      </div>
    );
  }

  if (index >= exercises.length) {
    return (
      <section className="sheet flex max-w-xl flex-col items-center gap-4 p-8 text-center" aria-live="polite">
        <LexaMascot mood={totals.current.good >= exercises.length / 2 ? "happy" : "neutral"} size={130} />
        <h2 className="text-2xl font-semibold">{t("review.summaryTitle")}</h2>
        <p className="marker px-1 text-xl">{t("review.summaryXp", { n: totals.current.xp })}</p>
        <p>{t("review.summaryCorrect", { a: totals.current.good, b: exercises.length })}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <TagButton
            onClick={() => {
              setExercises(null);
              setIndex(0);
            }}
          >
            {t("translate.again")}
          </TagButton>
          <Link href="/practice" className="tag-btn tag-btn-quiet">
            {t("practice.title")}
          </Link>
        </div>
      </section>
    );
  }

  const exercise = exercises[index];
  const toEnglish = exercise.direction === "ar2en";

  return (
    <section className="max-w-xl space-y-5">
      <p className="text-sm text-ink-faint" aria-live="polite">
        {t("review.progress", { a: index + 1, b: exercises.length })}
      </p>

      <div className="sheet space-y-4 p-6">
        <p className="font-semibold">{t(toEnglish ? "translate.ar2en" : "translate.en2ar")}</p>
        <p className="text-sm text-ink-soft">{t(toEnglish ? "translate.tip.ar2en" : "translate.tip.en2ar")}</p>
        <p className={`text-2xl leading-10 ${toEnglish ? "" : "ltr-text"}`}>{exercise.source}</p>
        <p className="text-sm">
          {t("translate.target", { word: "" })}
          <span className="ltr-text inline-block font-semibold">{exercise.term}</span>
        </p>
        {showHint ? (
          <p className="text-sm text-ink-soft">{exercise.hintAr}</p>
        ) : (
          !feedback && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="min-h-11 text-sm text-ink-soft underline underline-offset-4"
            >
              {t("translate.hintButton")}
            </button>
          )
        )}
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!feedback) void check();
        }}
      >
        <label htmlFor="translation" className="sr-only">
          {t("translate.placeholder")}
        </label>
        <textarea
          id="translation"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={feedback !== null}
          rows={3}
          maxLength={400}
          placeholder={t("translate.placeholder")}
          dir={toEnglish ? "ltr" : "rtl"}
          className="field text-lg"
          spellCheck={false}
          autoCapitalize="none"
        />

        {!feedback && (
          <TagButton type="submit" loading={busy} disabled={answer.trim().length === 0}>
            {t("translate.check")}
          </TagButton>
        )}
      </form>

      {error && (
        <p role="alert" className="pen-error text-pen-red">
          {error}
        </p>
      )}

      {feedback && (
        <div className="sheet space-y-4 p-6" aria-live="polite">
          <LexaMascot
            mood={feedback.verdict === "correct" ? "happy" : feedback.verdict === "almost" ? "neutral" : "sad"}
            size={88}
          />
          <p
            className={
              feedback.verdict === "wrong"
                ? "pen-error font-semibold text-pen-red"
                : feedback.verdict === "correct"
                  ? "marker px-1 font-semibold"
                  : "font-semibold text-amber"
            }
          >
            {t(`translate.verdict.${feedback.verdict}` as DictKey)}
          </p>
          <p>{feedback.explanationAr}</p>
          <div>
            <p className="text-sm text-ink-faint">{t("translate.corrected")}</p>
            <p className={`text-lg ${toEnglish ? "ltr-text" : ""}`}>{feedback.correctedVersion}</p>
          </div>
          <div>
            <p className="text-sm text-ink-faint">{t("translate.natural")}</p>
            <p className={`text-lg ${toEnglish ? "ltr-text" : ""}`}>{feedback.naturalVersion}</p>
          </div>
          <TagButton onClick={next}>
            {index + 1 < exercises.length ? t("translate.next") : t("translate.finish")}
          </TagButton>
        </div>
      )}
    </section>
  );
}
