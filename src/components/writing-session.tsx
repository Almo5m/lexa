"use client";

import { fetchAi } from "@/lib/fetch-ai";

import Link from "next/link";
import { useState } from "react";
import { RichText } from "@/components/rich-text";
import { TagButton } from "@/components/tag-button";
import { countWords, type WritingTask } from "@/features/writing/tasks";
import type { WritingGrade } from "@/features/writing/schemas";
import { useT } from "@/lib/i18n/provider";

type Result = WritingGrade & { total: number; words: number };

const MARKS = ["content", "organization", "grammar", "vocabulary"] as const;

/** Plan first, then write, then Bo marks the text on four skills and shows the mistakes and a polished version. */
export function WritingSession({ task }: { task: WritingTask }) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const words = countWords(text);
  const tooShort = words < task.minWords;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetchAi("/api/writing/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(t("writing.failed", { error: String(data.error ?? response.status) }));
        return;
      }
      setResult(data as Result);
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-5">
        <section className="sheet space-y-4 p-5" aria-labelledby="result-title">
          <h1 id="result-title" className="text-2xl font-semibold">{t("writing.result")}</h1>
          <p className="text-3xl font-bold">{result.total} / 20</p>
          <ul className="grid grid-cols-2 gap-3">
            {MARKS.map((key) => (
              <li key={key} className="rounded-2xl bg-paper-deep p-3">
                <p className="text-sm text-ink-soft">{t(`writing.mark.${key}`)}</p>
                <p className="text-xl font-bold">{result[key]} / 5</p>
              </li>
            ))}
          </ul>
          <RichText text={result.feedbackAr} />
        </section>

        {result.mistakes.length > 0 && (
          <section className="sheet space-y-3 p-5" aria-labelledby="mistakes-title">
            <h2 id="mistakes-title" className="font-bold">{t("writing.mistakes")}</h2>
            <ul className="space-y-3">
              {result.mistakes.map((mistake) => (
                <li key={mistake.original} className="space-y-1">
                  <p dir="ltr" className="text-left">
                    <span className="text-pen-red line-through">{mistake.original}</span> → <span className="font-semibold text-leaf">{mistake.fixed}</span>
                  </p>
                  <RichText text={mistake.explanationAr} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="sheet space-y-2 p-5" aria-labelledby="better-title">
          <h2 id="better-title" className="font-bold">{t("writing.better")}</h2>
          <p dir="ltr" className="whitespace-pre-wrap text-left leading-relaxed">{result.improvedVersion}</p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <TagButton gradient onClick={() => setResult(null)}>{t("writing.edit")}</TagButton>
          <Link href="/writing" className="tag-btn tag-btn-quiet justify-center">{t("writing.back")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-soft">{t("grammar.unit", { n: task.unit })} · {task.titleEn}</p>
        <h1 className="text-2xl font-semibold">{t("writing.task")}</h1>
      </div>

      <section className="sheet space-y-3 p-5">
        <p dir="ltr" className="text-left font-medium">{task.brief}</p>
        <h2 className="font-bold">{t("writing.plan")}</h2>
        <ul className="list-disc space-y-1 ps-5">
          {task.planAr.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-sm text-ink-soft">{t("writing.starters")}</p>
        <ul className="flex flex-wrap gap-2" dir="ltr">
          {task.starters.map((starter) => (
            <li key={starter} className="rounded-full bg-paper-deep px-3 py-1 text-sm">{starter}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <label htmlFor="writing-text" className="font-semibold">{t("writing.yourText")}</label>
        <textarea
          id="writing-text"
          dir="ltr"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={10}
          maxLength={2500}
          spellCheck={false}
          className="w-full rounded-2xl border border-line bg-white p-4 text-left leading-relaxed"
        />
        <p className={`text-sm ${tooShort ? "text-ink-soft" : "text-leaf"}`} role="status">
          {t("writing.count", { n: words, min: task.minWords })}
        </p>
      </section>

      {error && <p role="alert" className="text-pen-red">{error}</p>}
      <TagButton gradient loading={busy} disabled={tooShort} onClick={submit} className="w-full justify-center">
        {t("writing.submit")}
      </TagButton>
    </div>
  );
}
