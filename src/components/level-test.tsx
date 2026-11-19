"use client";

import { SessionProgress } from "@/components/session-progress";
import Link from "next/link";
import { useState } from "react";
import { BoLoader } from "@/components/bo-loader";
import { BoMascot } from "@/components/bo-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

type Stage = "intro" | "test" | "saving" | "skills" | "grading" | "result";

interface SkillTask {
  id: string;
  type: "en2ar" | "ar2en" | "word" | "write";
  prompt: string;
}

export function LevelTest({ words }: { words: string[] }) {
  const { t } = useT();
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ word: string; known: boolean }[]>([]);
  const [result, setResult] = useState<{ level: number; reliable: boolean; summaryAr?: string; aiSkipped?: boolean } | null>(null);
  const [tasks, setTasks] = useState<SkillTask[]>([]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);

  function restart() {
    setStage("intro");
    setIndex(0);
    setAnswers([]);
    setResult(null);
    setTasks([]);
    setTaskIndex(0);
    setTyped({});
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
      const data: { level: number; reliable: boolean; tasks: SkillTask[] } = await response.json();
      setResult({ level: data.level, reliable: data.reliable });
      if (data.reliable && data.tasks.length > 0) {
        setTasks(data.tasks);
        setStage("skills");
      } else {
        setStage("result");
      }
    } catch {
      setError(true);
      setStage("test");
      setAnswers(next.slice(0, -1));
    }
  }

  /** Sends the written answers to be marked. If that fails for any reason, the vocabulary level stays and the student is told. */
  async function grade(skip: boolean) {
    if (skip || tasks.every((task) => !(typed[task.id] ?? "").trim())) {
      setResult((current) => (current ? { ...current, aiSkipped: true } : current));
      return setStage("result");
    }
    setStage("grading");
    try {
      const response = await fetch("/api/level/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: tasks.map((task) => ({ id: task.id, answer: (typed[task.id] ?? "").trim() })) }),
      });
      if (!response.ok) throw new Error("assess_failed");
      const data: { level: number; summaryAr: string } = await response.json();
      setResult({ level: data.level, reliable: true, summaryAr: data.summaryAr });
    } catch {
      setResult((current) => (current ? { ...current, aiSkipped: true } : current));
    }
    setStage("result");
  }

  if (stage === "intro") {
    return (
      <div className="sheet max-w-xl space-y-5 p-6">
        <p className="leading-8">{t("level.intro")}</p>
        <TagButton onClick={() => setStage("test")}>{t("level.start")}</TagButton>
      </div>
    );
  }

  if (stage === "skills" && tasks.length > 0) {
    const task = tasks[taskIndex];
    const last = taskIndex === tasks.length - 1;
    const value = typed[task.id] ?? "";
    const english = task.type === "ar2en" || task.type === "write";
    return (
      <section className="sheet max-w-xl space-y-5 p-6" aria-live="polite">
        <SessionProgress label={t("level.skills.progress", { a: taskIndex + 1, b: tasks.length })} value={taskIndex} max={tasks.length} />
        <p className="font-semibold">{t(`level.skills.${task.type}` as DictKey)}</p>
        {task.prompt && <p className={`${task.type === "word" ? "text-4xl font-semibold" : "text-xl leading-9"} ${task.type === "ar2en" ? "" : "ltr-text"}`}>{task.prompt}</p>}
        {task.type === "write" ? (
          <textarea className={`field ${english ? "ltr-text" : ""}`} rows={4} maxLength={400} value={value} onChange={(e) => setTyped({ ...typed, [task.id]: e.target.value })} aria-label={t("level.skills.answer")} />
        ) : (
          <input className={`field ${english ? "ltr-text" : ""}`} maxLength={400} value={value} onChange={(e) => setTyped({ ...typed, [task.id]: e.target.value })} aria-label={t("level.skills.answer")} />
        )}
        <div className="flex flex-wrap gap-3">
          <TagButton onClick={() => (last ? void grade(false) : setTaskIndex(taskIndex + 1))}>{last ? t("level.skills.finish") : t("level.skills.next")}</TagButton>
          <TagButton quiet onClick={() => void grade(true)}>{t("level.skills.skip")}</TagButton>
        </div>
        <p className="text-sm text-ink-soft">{t("level.skills.hint")}</p>
      </section>
    );
  }

  if (stage === "grading") {
    return (
      <div className="sheet flex max-w-xl flex-col items-center gap-3 p-8 text-center" aria-live="polite">
        <BoLoader size={150} label={t("level.skills.grading")} />
        <p className="text-ink-soft">{t("level.skills.grading")}</p>
      </div>
    );
  }

  if (stage === "saving") {
    return (
      <div className="sheet flex max-w-xl flex-col items-center gap-3 p-8 text-center" aria-live="polite">
        <BoLoader size={150} label={t("common.loading")} />
      </div>
    );
  }

  if (stage === "result" && result) {
    return (
      <div className="sheet max-w-xl space-y-5 p-6" aria-live="polite">
        {result.reliable ? (
          <>
            <BoMascot mood="happy" size={140} />
            <h2 className="marker px-1 text-2xl font-semibold">{t("level.resultTitle", { n: result.level })}</h2>
            <p className="text-lg">{t(`level.name.${result.level}` as DictKey)}</p>
            {result.summaryAr && <p className="leading-8">{result.summaryAr}</p>}
            {result.aiSkipped && <p className="text-sm text-ink-soft">{t("level.skills.skipped")}</p>}
            <Link href="/suggest" className="tag-btn">
              {t("level.seeSuggestions")}
            </Link>
          </>
        ) : (
          <>
            <BoMascot mood="neutral" size={140} />
            <p className="pen-error text-pen-red">{t("level.unreliable")}</p>
            <TagButton onClick={restart}>{t("level.retake")}</TagButton>
          </>
        )}
      </div>
    );
  }

  return (
    <section className="sheet max-w-xl space-y-8 p-6" aria-live="polite">
      <SessionProgress label={t("level.progress", { a: index + 1, b: words.length })} value={index} max={words.length} />
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
