"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { RichText } from "@/components/rich-text";
import { SpeakButton, speak } from "@/components/speak-button";
import { LexaMascot } from "@/components/lexa-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { WordCard } from "@/features/ai/schemas";
import type { ReviewMode } from "@/features/srs/session";

export interface SessionWord {
  id: string;
  term: string;
  card: WordCard;
  mode: ReviewMode;
}

interface Result {
  correct: boolean;
  answer: string;
  xpGained: number;
  levelUp: boolean;
  goalReachedNow: boolean;
  countedForProgress: boolean;
  feedback: { correctedVersion: string; explanationAr: string } | null;
}

export function ReviewSession({ words, onDone }: { words: SessionWord[]; onDone?: () => void }) {
  const { t } = useT();
  const [queue, setQueue] = useState(words);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const combo = useRef(0);
  const totals = useRef({ xp: 0, correct: 0, answered: 0, levelUp: false, goal: false });
  const requeued = useRef(new Set<string>());

  const current = queue[index];
  const finished = index >= queue.length;

  function next() {
    setIndex((value) => value + 1);
    setAnswer("");
    setHint(false);
    setResult(null);
    setError(false);
  }

  async function submit(payload: { answer: string }) {
    if (!current || busy) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: current.id,
          mode: current.mode,
          hintUsed: hint,
          combo: combo.current,
          ...payload,
        }),
      });
      if (!response.ok) throw new Error("review_failed");
      const data: Result = await response.json();

      totals.current.answered += 1;
      totals.current.xp += data.xpGained;
      if (data.correct) {
        totals.current.correct += 1;
        combo.current += 1;
      } else {
        combo.current = 0;
        if (!requeued.current.has(current.id)) {
          requeued.current.add(current.id);
          setQueue((existing) => [...existing, current]);
        }
      }
      totals.current.levelUp ||= data.levelUp;
      totals.current.goal ||= data.goalReachedNow;

      setResult(data);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (finished) {
    const { xp, correct, answered, levelUp, goal } = totals.current;
    return (
      <section className="sheet flex flex-col items-center gap-4 p-8 text-center" aria-live="polite">
        <LexaMascot mood={answered === 0 || correct >= answered / 2 ? "happy" : "neutral"} size={130} />
        <h2 className="text-2xl font-semibold">{t("review.summaryTitle")}</h2>
        <p className="marker px-1 text-xl">{t("review.summaryXp", { n: xp })}</p>
        <p>{t("review.summaryCorrect", { a: correct, b: answered })}</p>
        {levelUp && <p className="font-semibold text-leaf">{t("review.levelUp")}</p>}
        {goal && <p className="font-semibold text-leaf">{t("review.goalDone")}</p>}
        <div className="pt-2">
          {onDone ? (
            <button type="button" autoFocus className="tag-btn" onClick={onDone}>
              {t("learn.continue")}
            </button>
          ) : (
            <Link href="/" className="tag-btn">
              {t("review.back")}
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <p className="text-sm text-ink-faint" aria-live="polite">
        {t("review.progress", { a: Math.min(index + 1, queue.length), b: queue.length })}
      </p>

      {(
        <TypedExercise
          key={`${current.id}-${index}`}
          word={current}
          answer={answer}
          setAnswer={setAnswer}
          hint={hint}
          setHint={setHint}
          result={result}
          busy={busy}
          onCheck={() => submit({ answer })}
          onNext={next}
        />
      )}

      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="pen-error text-pen-red">
            {t("common.error")}
          </p>
          {current.mode === "sentence" && (
            <TagButton quiet onClick={next}>
              {t("review.skip")}
            </TagButton>
          )}
        </div>
      )}
    </section>
  );
}

interface TypedProps {
  word: SessionWord;
  answer: string;
  setAnswer: (value: string) => void;
  hint: boolean;
  setHint: (value: boolean) => void;
  result: Result | null;
  busy: boolean;
  onCheck: () => void;
  onNext: () => void;
}

function TypedExercise({ word, answer, setAnswer, hint, setHint, result, busy, onCheck, onNext }: TypedProps) {
  const { t } = useT();
  const isListen = word.mode === "listen";
  const isSentence = word.mode === "sentence";

  return (
    <form
      className="sheet space-y-5 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!result && answer.trim()) onCheck();
      }}
    >
      {isListen ? (
        <div className="flex items-center gap-4">
          <SpeakButton text={word.term} label={t("card.listen")} />
          <p>{t("review.listenPrompt")}</p>
        </div>
      ) : isSentence ? (
        <div className="space-y-2">
          <p className="text-ink-soft">{t("review.sentencePrompt")}</p>
          <p className="ltr-text text-2xl font-semibold">{word.term}</p>
          <p className="text-sm text-ink-faint">{word.card.meaningsAr.join("، ")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-ink-soft">{t("review.writePrompt")}</p>
          <p className="text-2xl font-semibold">{word.card.meaningsAr.join("، ")}</p>
          {word.card.situationAr && <p className="text-sm text-ink-faint">{word.card.situationAr}</p>}
        </div>
      )}

      <div>
        <label htmlFor="answer" className="sr-only">
          {t("review.typeHere")}
        </label>
        <input
          id="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={result !== null}
          placeholder={isSentence ? t("review.sentencePlaceholder") : t("review.typeHere")}
          className="field ltr-text text-xl"
          aria-invalid={result && !result.correct ? true : undefined}
          maxLength={isSentence ? 300 : 60}
          autoFocus
          autoComplete="off"
          autoCapitalize={isSentence ? "sentences" : "none"}
          spellCheck={false}
        />
      </div>

      {hint && !result && (
        <p className="text-sm text-ink-soft">
          {t("review.hint", { letter: word.term[0], n: word.term.length })}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {result ? (result.correct ? t("review.correct") : isSentence ? "" : t("review.wrong", { word: result.answer })) : ""}
      </p>
      <div className="flex flex-wrap items-center gap-3 empty:hidden">
        {result && <LexaMascot mood={result.correct ? "happy" : "sad"} size={76} />}
        {result &&
          (result.correct ? (
            <p className="marker px-1 font-semibold">{t("review.correct")}</p>
          ) : isSentence ? null : (
            <p className="pen-error ltr-text font-semibold text-pen-red">
              {t("review.wrong", { word: result.answer })}
            </p>
          ))}
        {result && !result.countedForProgress && (
          <p className="mt-1 text-sm text-ink-faint">{t("review.practiceOnly")}</p>
        )}
      </div>

      {result?.feedback && (
        <div className="space-y-2 rounded-lg border border-line bg-paper-deep p-4">
          <RichText text={result.feedback.explanationAr} />
          {result.feedback.correctedVersion && (
            <p className="ltr-text text-ink-soft">
              <span className="text-sm text-ink-faint">{t("review.yourSentence")} </span>
              {result.feedback.correctedVersion}
            </p>
          )}
        </div>
      )}

      {result && !result.correct && !isSentence && (
        <button
          type="button"
          onClick={() => speak(word.card.sentence)}
          className="ltr-text min-h-11 text-start text-ink-soft underline underline-offset-4"
        >
          {word.card.sentence}
        </button>
      )}

      <div className="flex flex-wrap gap-3">
        {!result ? (
          <>
            <TagButton type="submit" loading={busy} disabled={answer.trim().length === 0}>
              {t("review.check")}
            </TagButton>
            {!hint && !isSentence && (
              <TagButton quiet onClick={() => setHint(true)}>
                {t("review.hintButton")}
              </TagButton>
            )}
          </>
        ) : (
          <button type="button" autoFocus className="tag-btn" onClick={onNext}>
            {t("review.next")}
          </button>
        )}
      </div>
    </form>
  );
}
