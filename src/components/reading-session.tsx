"use client";

import { fetchAi } from "@/lib/fetch-ai";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BoLoader } from "@/components/bo-loader";
import { BoMascot } from "@/components/bo-mascot";
import { RichText } from "@/components/rich-text";
import { SpeakButton } from "@/components/speak-button";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { ReadingView } from "@/features/reading/view";

type Load = { name: "loading" } | { name: "ready" } | { name: "error"; reason: string };

export function ReadingSession() {
  const { t } = useT();
  const [load, setLoad] = useState<Load>({ name: "loading" });
  const [view, setView] = useState<ReadingView | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [xp, setXp] = useState(0);
  // The question the student is looking at. It moves on only when he taps "next", so he can read the explanation.
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const response = await fetchAi("/api/reading", { method: "POST" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return setLoad({ name: "error", reason: data.error ?? "server_error" });
        const loaded = data as ReadingView;
        setView(loaded);
        setShown(Math.min(loaded.answered.length, loaded.questions.length - 1));
        setLoad({ name: "ready" });
      } catch {
        setLoad({ name: "error", reason: "server_error" });
      }
    })();
  }, []);

  async function submitChoice(choice: number) {
    if (!view || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/reading/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: view.answered.length, choice }),
      });
      if (!response.ok) throw new Error("answeredfailed");
      const data: { view: ReadingView; xpGained: number } = await response.json();
      setView(data.view);
      setXp((value) => value + data.xpGained);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (load.name === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <BoLoader size={140} label={t("read.loading")} />
        <p className="text-ink-soft">{t("read.loading")}</p>
      </div>
    );
  }

  if (load.name === "error" || !view) {
    const notEnough = load.name === "error" && load.reason === "not_enough_words";
    return (
      <section className="sheet space-y-4 p-6 text-center">
        <p role="alert" className={notEnough ? "text-ink" : "text-pen-red"}>
          {notEnough ? t("read.notEnough") : load.name === "error" && load.reason === "daily_ai_limit_reached" ? t("error.daily_ai_limit_reached") : t("common.error")}
        </p>
        <Link href={notEnough ? "/learn" : "/"} className="tag-btn">
          {notEnough ? t("read.goLearn") : t("review.back")}
        </Link>
      </section>
    );
  }

  const plain = view.text.replace(/\*\*/g, "");
  const current = view.questions[shown];
  const answered = view.answered[shown];
  const lastShown = shown === view.questions.length - 1;

  return (
    <div className="space-y-5">
      <article className="sheet space-y-4 p-6">
        <header className="flex items-start justify-between gap-3">
          <h2 className="ltr-text text-2xl font-semibold">{view.title}</h2>
          <SpeakButton text={plain} label={t("read.listen")} />
        </header>
        <div dir="ltr" className="ltr-text text-xl leading-9">
          <RichText text={view.text} />
        </div>
        <p className="text-sm text-ink-faint">
          {t("read.words")} <span className="ltr-text inline-block font-medium">{view.words.join(" · ")}</span>
        </p>
      </article>

      {!view.completed || answered ? (
        <section className="sheet space-y-4 p-6" aria-live="polite">
          <p className="text-sm text-ink-faint">{t("read.question", { a: shown + 1, b: view.questions.length })}</p>
          <p dir="auto" className="text-lg font-semibold">{current.question}</p>
          <div className="space-y-2" role="group" aria-label={current.question}>
            {current.options.map((option, index) => {
              const picked = answered?.choice === index;
              const right = answered?.correctIndex === index;
              const state = !answered ? "bg-paper-deep" : right ? "bg-[#d9f5e6] ring-2 ring-leaf" : picked ? "bg-[#ffe3e3] ring-2 ring-pen-red" : "bg-paper-deep opacity-60";
              return (
                <button
                  key={option}
                  type="button"
                  dir="auto"
                  disabled={busy || answered !== undefined}
                  onClick={() => submitChoice(index)}
                  className={`flex min-h-12 w-full items-center rounded-xl px-4 py-3 text-start font-medium transition ${state}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {failed && <p role="alert" className="text-pen-red">{t("common.error")}</p>}
          {answered && (
            <div className="space-y-3 rounded-lg border border-line bg-paper-deep p-4">
              <p className={`font-semibold ${answered.correct ? "text-leaf" : "text-pen-red"}`}>{answered.correct ? t("read.right") : t("read.wrong")}</p>
              <RichText text={answered.explanationAr} />
            </div>
          )}
          {answered && !lastShown && (
            <TagButton autoFocus className="w-full sm:w-auto" onClick={() => setShown(shown + 1)}>
              {t("read.nextQuestion")}
            </TagButton>
          )}
        </section>
      ) : null}

      {view.completed && answered && lastShown && (
        <section className="sheet flex flex-col items-center gap-3 p-6 text-center">
          <BoMascot mood={view.score >= 2 ? "happy" : "neutral"} size={110} />
          <h2 className="text-xl font-semibold">{t("read.score", { a: view.score, b: view.questions.length })}</h2>
          {xp > 0 && <p className="marker px-1 font-semibold">{t("review.summaryXp", { n: xp })}</p>}
          {view.textAr && (
            <div className="w-full rounded-lg border border-line bg-paper-deep p-4 text-start">
              <h3 className="mb-1 font-semibold">{t("read.translation")}</h3>
              <p className="text-ink-soft">{view.textAr}</p>
            </div>
          )}
          <Link href="/" className="tag-btn">
            {t("learn.backToday")}
          </Link>
        </section>
      )}
    </div>
  );
}
