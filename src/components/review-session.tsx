"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { WordCardView } from "@/components/word-card-view";
import { SpeakButton, speak } from "@/components/speak-button";
import { ScrambleText, TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { WordCard } from "@/features/ai/schemas";
import type { ReviewMode } from "@/features/srs/session";
import type { Grade } from "@/features/srs/types";

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
}

export function ReviewSession({ words }: { words: SessionWord[] }) {
  const { t } = useT();
  const [queue, setQueue] = useState(words);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
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
    setRevealed(false);
    setAnswer("");
    setHint(false);
    setResult(null);
    setError(false);
  }

  async function submit(payload: { grade?: Grade; answer?: string }) {
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

      if (current.mode === "recall") next();
      else setResult(data);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (finished) {
    const { xp, correct, answered, levelUp, goal } = totals.current;
    return (
      <section className="sheet space-y-4 p-6" aria-live="polite">
        <h2 className="text-2xl font-semibold">{t("review.summaryTitle")}</h2>
        <p className="marker inline px-1 text-xl">{t("review.summaryXp", { n: xp })}</p>
        <p>{t("review.summaryCorrect", { a: correct, b: answered })}</p>
        {levelUp && <p className="font-semibold text-leaf">{t("review.levelUp")}</p>}
        {goal && <p className="font-semibold text-leaf">{t("review.goalDone")}</p>}
        <div className="pt-2">
          <Link href="/" className="tag-btn">
            {t("review.back")}
          </Link>
        </div>
      </section>
    );
  }

  const gradeButtons: { grade: Grade; label: string }[] = [
    { grade: "again", label: t("review.again") },
    { grade: "hard", label: t("review.hard") },
    { grade: "good", label: t("review.good") },
    { grade: "easy", label: t("review.easy") },
  ];

  return (
    <section className="space-y-5">
      <p className="text-sm text-ink-faint" aria-live="polite">
        {t("review.progress", { a: Math.min(index + 1, queue.length), b: queue.length })}
      </p>

      {current.mode === "recall" && (
        <div className="space-y-5">
          <p className="text-ink-soft">{t("review.recallPrompt")}</p>
          <WordCardView key={current.id} card={current.card} onRevealChange={setRevealed} />
          <div className="flex flex-wrap gap-3" role="group" aria-label={t("review.title")}>
            {gradeButtons.map((item) => (
              <TagButton
                key={item.grade}
                quiet={item.grade !== "good"}
                loading={busy}
                disabled={!revealed}
                onClick={() => submit({ grade: item.grade })}
              >
                {item.label}
              </TagButton>
            ))}
          </div>
        </div>
      )}

      {current.mode !== "recall" && (
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
        <p role="alert" className="pen-error text-pen-red">
          {t("common.error")}
        </p>
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
      ) : (
        <div className="space-y-2">
          <p className="text-ink-soft">{t("review.writePrompt")}</p>
          <p className="text-2xl font-semibold">{word.card.meaningsAr.join("، ")}</p>
          <p className="text-sm text-ink-faint">{word.card.situationAr}</p>
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
          placeholder={t("review.typeHere")}
          className="field ltr-text text-xl"
          aria-invalid={result && !result.correct ? true : undefined}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>

      {hint && !result && (
        <p className="text-sm text-ink-soft">
          {t("review.hint", { letter: word.term[0], n: word.term.length })}
        </p>
      )}

      <div aria-live="polite" className="min-h-8">
        {result &&
          (result.correct ? (
            <p className="marker inline px-1 font-semibold">{t("review.correct")}</p>
          ) : (
            <p className="pen-error ltr-text font-semibold text-pen-red">
              {t("review.wrong", { word: result.answer })}
            </p>
          ))}
        {result && !result.countedForProgress && (
          <p className="mt-1 text-sm text-ink-faint">{t("review.practiceOnly")}</p>
        )}
      </div>

      {result && !result.correct && (
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
              {busy ? <ScrambleText text={t("common.loading")} /> : t("review.check")}
            </TagButton>
            {!hint && (
              <TagButton quiet onClick={() => setHint(true)}>
                {t("review.hintButton")}
              </TagButton>
            )}
          </>
        ) : (
          <TagButton onClick={onNext}>{t("review.next")}</TagButton>
        )}
      </div>
    </form>
  );
}
