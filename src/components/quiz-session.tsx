"use client";

import { SessionProgress } from "@/components/session-progress";
import Link from "next/link";
import { useRef, useState } from "react";
import { SpeakButton } from "@/components/speak-button";
import { BoMascot } from "@/components/bo-mascot";
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
        <BoMascot mood={correct >= questions.length / 2 ? "happy" : "neutral"} size={130} />
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
      <SessionProgress label={t("review.progress", { a: index + 1, b: questions.length })} value={index + (answered ? 1 : 0)} max={questions.length} />

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
                className={`choice ${answersWithEnglish ? "ltr-text" : ""} ${isRight ? "choice-right" : ""} ${isWrongPick ? "choice-wrong" : ""}`}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="flex min-h-8 items-center gap-3">
        {answered && <BoMascot mood={answered.correct ? "happy" : "sad"} size={76} />}
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
