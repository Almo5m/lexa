"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { speak } from "@/components/speak-button";
import { TagButton } from "@/components/tag-button";
import type { ListeningTask } from "@/features/listening/tasks";
import { useT } from "@/lib/i18n/provider";

const MAX_PLAYS = 3;

/** Listen up to three times without the text, answer the questions, then read the script. */
export function ListeningSession({ task }: { task: ListeningTask }) {
  const { t } = useT();
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);
  const [picked, setPicked] = useState<(number | null)[]>(() => task.questions.map(() => null));
  const [done, setDone] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const score = picked.filter((choice, i) => choice === task.questions[i].answer).length;
  const total = task.questions.length;
  const allAnswered = picked.every((choice) => choice !== null);

  function play() {
    if (playing || plays >= MAX_PLAYS) return;
    setPlaying(true);
    setPlays((value) => value + 1);
    if (!speak(task.script, () => setPlaying(false))) setPlaying(false);
  }

  function finish() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setDone(true);
    void fetch("/api/book/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "listening", itemId: task.id, score }),
    }).catch(() => undefined);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-soft">{t("grammar.unit", { n: task.unit })}</p>
        <h1 className="text-2xl font-semibold" dir="ltr">{task.title}</h1>
      </div>

      <section className="sheet space-y-3 p-5">
        {supported ? (
          <>
            <TagButton gradient onClick={play} disabled={playing || plays >= MAX_PLAYS} className="w-full justify-center">
              {playing ? t("listening.playing") : plays === 0 ? t("listening.play") : t("listening.playAgain")}
            </TagButton>
            <p className="text-sm text-ink-soft" role="status">{t("listening.left", { n: MAX_PLAYS - plays })}</p>
          </>
        ) : (
          <p className="text-pen-red">{t("listening.unsupported")}</p>
        )}
      </section>

      <ol className="space-y-4">
        {task.questions.map((question, qi) => (
          <li key={question.q} className="sheet space-y-3 p-5">
            <p dir="ltr" className="text-left font-medium">{qi + 1}. {question.q}</p>
            <ul className="space-y-2" dir="ltr">
              {question.options.map((option, oi) => {
                const isRight = done && oi === question.answer;
                const isWrong = done && picked[qi] === oi && oi !== question.answer;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      disabled={done}
                      aria-pressed={picked[qi] === oi}
                      onClick={() => setPicked((previous) => previous.map((value, i) => (i === qi ? oi : value)))}
                      className={`min-h-12 w-full rounded-2xl border px-4 py-2 text-left ${
                        isRight ? "border-leaf bg-leaf/15" : isWrong ? "border-pen-red bg-pen-red/10" : picked[qi] === oi ? "border-indigo bg-indigo/10" : "border-line"
                      }`}
                    >
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>
            {done && <p className="text-sm">{question.why}</p>}
          </li>
        ))}
      </ol>

      {done ? (
        <section className="sheet space-y-3 p-5" aria-labelledby="script-title">
          <p className="text-2xl font-bold">{score} / {total}</p>
          <h2 id="script-title" className="font-bold">{t("listening.script")}</h2>
          <p dir="ltr" className="text-left leading-relaxed">{task.script}</p>
          <Link href="/listening" className="tag-btn tag-btn-quiet justify-center">{t("listening.back")}</Link>
        </section>
      ) : (
        <TagButton gradient disabled={!allAnswered} onClick={finish} className="w-full justify-center">
          {t("listening.check")}
        </TagButton>
      )}
    </div>
  );
}
