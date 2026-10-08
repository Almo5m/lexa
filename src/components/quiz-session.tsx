"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SpeakButton } from "@/components/speak-button";
import { LexaMascot } from "@/components/lexa-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { QuizQuestion } from "@/features/quiz/build";

interface Answered {
  chosenId: string;
  correct: boolean;
  answer: string;
}

export function QuizSession({ questions }: { questions: QuizQuestion[] }) {
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const combo = useRef(0);
  const totals = useRef({ xp: 0, correct: 0, levelUp: false, goal: false });

  const question = questions[index];
  const finished = index >= questions.length;

  async function choose(chosenId: string) {
    if (answered || busy) return;
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: question.wordId, chosenId, combo: combo.current }),
      });
      if (!response.ok) throw new Error("quiz_failed");
      const data = await response.json();
      totals.current.xp += data.xpGained;
      totals.current.levelUp ||= data.levelUp;
      totals.current.goal ||= data.goalReachedNow;
      if (data.correct) {
        totals.current.correct += 1;
        combo.current += 1;
      } else {
        combo.current = 0;
      }
      setAnswered({ chosenId, correct: data.correct, answer: data.answer });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (finished) {
    const { xp, correct, levelUp, goal } = totals.current;
    return (
      <section className="sheet flex max-w-xl flex-col items-center gap-4 p-8 text-center" aria-live="polite">
        <LexaMascot mood={correct >= questions.length / 2 ? "happy" : "neutral"} size={130} />
        <h2 className="text-2xl font-semibold">{t("review.summaryTitle")}</h2>
        <p className="marker px-1 text-xl">{t("review.summaryXp", { n: xp })}</p>
        <p>{t("review.summaryCorrect", { a: correct, b: questions.length })}</p>
        {levelUp && <p className="font-semibold text-leaf">{t("review.levelUp")}</p>}
        {goal && <p className="font-semibold text-leaf">{t("review.goalDone")}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <a href="/quiz" className="tag-btn">
            {t("quiz.again")}
          </a>
          <Link href="/practice" className="tag-btn tag-btn-quiet">
            {t("practice.title")}
          </Link>
        </div>
      </section>
    );
  }

  const answersWithEnglish = question.type === "word" || question.type === "gap" || question.type === "situation";

  return (
    <section className="max-w-xl space-y-6">
      <p className="text-sm text-ink-faint" aria-live="polite">
        {t("review.progress", { a: index + 1, b: questions.length })}
      </p>

      <div className="sheet space-y-4 p-6">
        <p className="text-ink-soft">{t(`quiz.q.${question.type}` as DictKey)}</p>
        <div className="flex items-start gap-3">
          {question.prompt && (
            <p
              className={`flex-1 text-2xl font-semibold leading-10 ${
                question.type === "meaning" || question.type === "gap" ? "ltr-text" : ""
              }`}
            >
              {question.prompt}
            </p>
          )}
          {question.audio && <SpeakButton text={question.audio} label={t("card.listen")} />}
        </div>
      </div>

      <ul className="grid gap-3" role="list">
        {question.options.map((option) => {
          const isRight = answered && option.id === question.wordId;
          const isWrongPick = answered && option.id === answered.chosenId && !answered.correct;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => choose(option.id)}
                disabled={answered !== null || busy}
                className={`flex min-h-14 w-full items-center rounded-md px-4 text-start text-lg shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep disabled:cursor-default ${
                  answersWithEnglish ? "ltr-text" : ""
                } ${isRight ? "marker !bg-[length:100%_100%] font-semibold" : ""} ${
                  isWrongPick ? "pen-error text-pen-red" : ""
                }`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="flex min-h-8 items-center gap-3">
        {answered && <LexaMascot mood={answered.correct ? "happy" : "sad"} size={76} />}
        {answered &&
          (answered.correct ? (
            <p className="font-semibold text-leaf">{t("quiz.correct")}</p>
          ) : (
            <p className="ltr-text font-semibold text-pen-red">{t("quiz.wrong", { word: answered.answer })}</p>
          ))}
        {error && (
          <p role="alert" className="pen-error text-pen-red">
            {t("common.error")}
          </p>
        )}
      </div>

      {answered && (
        <TagButton
          onClick={() => {
            setIndex(index + 1);
            setAnswered(null);
          }}
        >
          {index + 1 < questions.length ? t("quiz.next") : t("quiz.finish")}
        </TagButton>
      )}
    </section>
  );
}
