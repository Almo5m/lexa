"use client";

import { SessionProgress } from "@/components/session-progress";
import Link from "next/link";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { isCorrectTyped, type GrammarUnit } from "@/features/grammar/types";
import { useT } from "@/lib/i18n/provider";

type Phase = "lesson" | "exercise" | "done";

/** Lesson first, then the exercises one by one with an instant check and a short reason after each answer. */
export function GrammarSession({ unit, images = [] }: { unit: GrammarUnit; images?: { id: string; url: string }[] }) {
  const { t } = useT();
  const [phase, setPhase] = useState<Phase>("lesson");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const exercise = unit.exercises[index];
  const total = unit.exercises.length;

  const correct =
    exercise?.kind === "choose" ? picked === exercise.answer : exercise?.kind === "type" ? isCorrectTyped(typed, exercise.answers) : false;
  const canCheck = exercise?.kind === "choose" ? picked !== null : typed.trim() !== "";

  function check() {
    setChecked(true);
    if (correct) setScore((value) => value + 1);
  }

  function next() {
    if (index + 1 >= total) {
      void fetch("/api/book/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "grammar", itemId: unit.id, score }),
      }).catch(() => undefined);
      setPhase("done");
      return;
    }
    setIndex(index + 1);
    setPicked(null);
    setTyped("");
    setChecked(false);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setTyped("");
    setChecked(false);
    setScore(0);
    setPhase("exercise");
  }

  if (phase === "lesson") {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm text-ink-soft">{t("grammar.unit", { n: unit.number })} · {unit.topic}</p>
          <h1 className="text-2xl font-semibold" dir="ltr">{unit.rule}</h1>
        </div>
        {images.length > 0 ? (
          <section className="space-y-3" aria-label={t("grammar.lesson")}>
            <ol className="space-y-3">
              {images.map((image, index) => (
                <li key={image.id}>
                  <a href={image.url} target="_blank" rel="noopener noreferrer" className="sheet block overflow-hidden p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={t("grammar.imageAlt", { n: index + 1 })} loading={index === 0 ? "eager" : "lazy"} className="h-auto w-full rounded-xl" />
                  </a>
                </li>
              ))}
            </ol>
            <p className="text-center text-xs text-ink-faint">{t("grammar.imageTap")}</p>
          </section>
        ) : (
          <>
          <section className="sheet space-y-3 p-5" aria-labelledby="lesson-title">
            <h2 id="lesson-title" className="font-bold">{t("grammar.lesson")}</h2>
            <ul className="space-y-2">
              {unit.lessonAr.map((line) => (
                <li key={line} className="leading-relaxed">{line}</li>
              ))}
            </ul>
          </section>
          <section className="sheet space-y-3 p-5" aria-labelledby="examples-title">
            <h2 id="examples-title" className="font-bold">{t("grammar.examples")}</h2>
            <ul className="space-y-3">
              {unit.examples.map(([en, ar]) => (
                <li key={en}>
                  <p dir="ltr" className="text-left font-medium">{en}</p>
                  <p className="text-sm text-ink-soft">{ar}</p>
                </li>
              ))}
            </ul>
          </section>
          </>
        )}
        <TagButton gradient onClick={() => setPhase("exercise")} className="w-full justify-center">
          {t("grammar.start")}
        </TagButton>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="space-y-5 text-center">
        <h1 className="text-2xl font-semibold">{t("grammar.done")}</h1>
        <p className="text-3xl font-bold">{score} / {total}</p>
        <p className="text-ink-soft">{score / total >= 0.8 ? t("grammar.doneGood") : t("grammar.doneMore")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <TagButton gradient onClick={restart}>{t("grammar.again")}</TagButton>
          <Link href="/grammar" className="tag-btn tag-btn-quiet justify-center">{t("grammar.back")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SessionProgress label={t("grammar.question", { a: index + 1, b: total })} value={index + (checked ? 1 : 0)} max={total} />

      <section className="sheet space-y-4 p-5">
        <p dir="ltr" className="text-left text-lg font-medium">{exercise.q}</p>

        {exercise.kind === "choose" ? (
          <ul className="space-y-2" dir="ltr">
            {exercise.options.map((option, i) => {
              const isRight = checked && i === exercise.answer;
              const isWrong = checked && i === picked && i !== exercise.answer;
              return (
                <li key={option}>
                  <button
                    type="button"
                    disabled={checked}
                    onClick={() => setPicked(i)}
                    aria-pressed={picked === i}
                    className={`choice ${isRight ? "choice-right" : ""} ${isWrong ? "choice-wrong" : ""} ${picked === i && !checked ? "choice-picked" : ""}`}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <input
            dir="ltr"
            value={typed}
            disabled={checked}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && !checked && canCheck && check()}
            placeholder={t("grammar.typeHere")}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-left"
          />
        )}

        {checked && (
          <div role="status" className={`pop-in rounded-2xl p-4 ${correct ? "bg-leaf/15" : "bg-pen-red/10"}`}>
            <p className="font-bold">{correct ? t("grammar.correct") : t("grammar.wrong")}</p>
            {!correct && exercise.kind === "type" && (
              <p dir="ltr" className="text-left text-sm font-medium">{t("grammar.answerIs")} {exercise.answers[0]}</p>
            )}
            <p className="mt-1 text-sm">{exercise.why}</p>
          </div>
        )}
      </section>

      {checked ? (
        <TagButton gradient onClick={next} className="w-full justify-center">
          {index + 1 >= total ? t("grammar.finish") : t("grammar.next")}
        </TagButton>
      ) : (
        <TagButton gradient disabled={!canCheck} onClick={check} className="w-full justify-center">
          {t("grammar.check")}
        </TagButton>
      )}
    </div>
  );
}
