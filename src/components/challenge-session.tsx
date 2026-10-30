"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BoLoader } from "@/components/bo-loader";
import { BoMascot } from "@/components/bo-mascot";
import { SessionProgress } from "@/components/session-progress";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { PublicQuestion } from "@/features/challenge/questions";

type Phase =
  | { name: "loading" }
  | { name: "error" }
  | { name: "none" }
  | { name: "done"; score: number; max: number; standings?: Standing[] }
  | { name: "intro" }
  | { name: "play" }
  | { name: "saving" }
  | { name: "result"; score: number; max: number; xp: number; correct: number[]; standings?: Standing[] };

interface Standing {
  score: number;
  me: boolean;
  creator: boolean;
}

/** Five quick questions, two minutes, the same for every student today. The answers are checked on the server. */
export function ChallengeSession({ api = "/api/challenge" }: { api?: string }) {
  const { t } = useT();
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [seconds, setSeconds] = useState(120);
  const [left, setLeft] = useState(120);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const answersRef = useRef<(number | null)[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(api);
        if (!response.ok) throw new Error("load");
        const data = await response.json();
        setSeconds(data.seconds);
        setLeft(data.seconds);
        if (data.done) return setPhase({ name: "done", score: data.done.score, max: data.done.max, standings: data.standings });
        if (!data.available) return setPhase({ name: "none" });
        setQuestions(data.questions);
        setPhase({ name: "intro" });
      } catch {
        setPhase({ name: "error" });
      }
    })();
  }, []);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    setPhase({ name: "saving" });
    try {
      const response = await fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: answersRef.current }) });
      if (response.status === 409) return setPhase({ name: "done", score: 0, max: 0 });
      if (!response.ok) throw new Error("save");
      const data = await response.json();
      setPhase({ name: "result", score: data.score, max: data.max, xp: data.xp, correct: data.correct, standings: data.standings });
    } catch {
      setPhase({ name: "error" });
    }
  }, [api]);

  useEffect(() => {
    if (phase.name !== "play") return;
    const id = setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          clearInterval(id);
          void finish();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase.name, finish]);

  function pick(choice: number) {
    const next = [...answersRef.current];
    next[index] = choice;
    answersRef.current = next;
    setAnswers(next);
    if (index + 1 >= questions.length) void finish();
    else setIndex(index + 1);
  }

  function start() {
    answersRef.current = [];
    setAnswers([]);
    setIndex(0);
    setLeft(seconds);
    finished.current = false;
    setPhase({ name: "play" });
  }

  if (phase.name === "loading" || phase.name === "saving") return <BoLoader label={phase.name === "saving" ? t("challenge.saving") : t("common.loading")} />;

  if (phase.name === "error") {
    return (
      <div className="sheet space-y-4 p-6 text-center">
        <p className="pen-error">{t("common.error")}</p>
        <Link href="/practice" className="tag-btn tag-btn-quiet justify-center">{t("challenge.back")}</Link>
      </div>
    );
  }

  if (phase.name === "none") {
    return (
      <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
        <BoMascot mood="neutral" size={120} />
        <p className="text-ink-soft">{t("challenge.none")}</p>
        <Link href="/practice" className="tag-btn tag-btn-quiet justify-center">{t("challenge.back")}</Link>
      </div>
    );
  }

  if (phase.name === "done") {
    return (
      <div className="sheet flex flex-col items-center gap-3 p-8 text-center">
        <BoMascot mood="happy" size={120} />
        <h2 className="text-xl font-bold">{t("challenge.doneTitle")}</h2>
        {phase.max > 0 && <p className="ltr-text text-3xl font-bold">{phase.score} / {phase.max}</p>}
        <p className="text-ink-soft">{t("challenge.doneText")}</p>
        {phase.standings && <Standings rows={phase.standings} />}
        <Link href="/" className="tag-btn justify-center">{t("learn.backToday")}</Link>
      </div>
    );
  }

  if (phase.name === "intro") {
    return (
      <div className="hero-card space-y-4 p-6 text-center">
        <BoMascot mood="happy" size={110} className="mx-auto" />
        <h2 className="text-xl font-bold">{t("challenge.introTitle")}</h2>
        <p className="opacity-90">{t("challenge.introText", { n: questions.length, m: Math.round(seconds / 60) })}</p>
        <TagButton onClick={start} className="w-full justify-center sm:w-auto">{t("challenge.start")}</TagButton>
      </div>
    );
  }

  if (phase.name === "result") {
    const perfect = phase.score === phase.max;
    return (
      <div className="space-y-5">
        <div className="sheet flex flex-col items-center gap-3 p-6 text-center">
          <BoMascot mood={phase.score >= phase.max / 2 ? "happy" : "sad"} size={110} />
          <h2 className="text-xl font-bold">{perfect ? t("challenge.perfect") : t("challenge.resultTitle")}</h2>
          <p className="ltr-text text-4xl font-bold">{phase.score} / {phase.max}</p>
          {phase.xp > 0 && <p className="font-semibold text-indigo">{t("challenge.xp", { n: phase.xp })}</p>}
        </div>
        {phase.standings && <Standings rows={phase.standings} />}
        <ol className="space-y-2">
          {questions.map((question, i) => {
            const right = answersRef.current[i] === phase.correct[i];
            return (
              <li key={question.term} className="sheet flex items-center justify-between gap-3 px-4 py-3">
                <span className="ltr-text font-semibold">{question.term}</span>
                <span className={right ? "font-semibold text-leaf" : "font-semibold text-pen-red"}>
                  {right ? "✓" : question.options[phase.correct[i]]}
                </span>
              </li>
            );
          })}
        </ol>
        <Link href="/" className="tag-btn w-full justify-center">{t("learn.backToday")}</Link>
      </div>
    );
  }

  const question = questions[index];
  const urgent = left <= 20;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SessionProgress label={t("challenge.question", { a: index + 1, b: questions.length })} value={index} max={questions.length} />
        <p className={`text-sm font-semibold ${urgent ? "text-pen-red" : "text-ink-faint"}`} role="timer" aria-live="off">
          {t("challenge.time", { s: left })}
        </p>
      </div>
      <section className="sheet space-y-4 p-5">
        <p className="ltr-text text-center text-3xl font-bold">{question.term}</p>
        <p className="text-center text-sm text-ink-soft">{t("challenge.ask")}</p>
        <ul className="space-y-2">
          {question.options.map((option, i) => (
            <li key={option}>
              <button type="button" className={`choice ${answers[index] === i ? "choice-picked" : ""}`} onClick={() => pick(i)}>
                {option}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Scores of everyone who played the same duel. No names: "you", the one who challenged, and friends. */
function Standings({ rows }: { rows: Standing[] }) {
  const { t } = useT();
  return (
    <section className="sheet w-full space-y-2 p-4 text-start">
      <h3 className="font-bold">{t("duel.standings")}</h3>
      <ol className="space-y-1">
        {rows.map((row, i) => (
          <li key={i} className={`flex justify-between gap-3 ${row.me ? "font-bold text-indigo" : ""}`}>
            <span>{row.me ? t("board.you") : row.creator ? t("duel.creator") : t("duel.friend")}</span>
            <span className="ltr-text">{row.score}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
