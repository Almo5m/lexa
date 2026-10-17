"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { RichText } from "@/components/rich-text";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { MAX_CHARS, MIN_CHARS, bandLabel } from "@/features/talk/analyze";
import type { TalkAnalysis } from "@/features/talk/schemas";

interface Props {
  topics: { id: string; prompt: string }[];
}

interface Result {
  analysis: TalkAnalysis;
  xpGained: number;
  /** Set when the topic was "use today's words": which of them the student really used. */
  wordsUsed: { target: string[]; used: string[] } | null;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function createRecognition(): Recognition | null {
  const Ctor = (window as unknown as Record<string, (new () => Recognition) | undefined>).SpeechRecognition
    ?? (window as unknown as Record<string, (new () => Recognition) | undefined>).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function TalkSession({ topics }: Props) {
  const { t } = useT();
  const router = useRouter();
  const [topicIndex, setTopicIndex] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<DictKey | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const topic = topics[topicIndex % topics.length];

  function toggleMic() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const instance = createRecognition();
    if (!instance) return;
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.onresult = (event) => {
      const heard = Array.from(event.results)
        .map((item) => item[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (heard) setText((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${heard}`.slice(0, MAX_CHARS));
    };
    instance.onend = () => setListening(false);
    instance.onerror = () => setListening(false);
    recognition.current = instance;
    setListening(true);
    instance.start();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (text.trim().length < MIN_CHARS) {
      setError("talk.err.short");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.id, text: text.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        const known: Record<string, DictKey> = {
          not_english: "talk.err.notEnglish",
          daily_ai_limit_reached: "tutor.limit",
          ai_busy: "tutor.busy",
          ai_unavailable: "tutor.unavailable",
        };
        setError(known[data.error] ?? "common.error");
        return;
      }
      setResult(data as Result);
      router.refresh();
    } catch {
      setError("common.error");
    } finally {
      setBusy(false);
    }
  }

  function again() {
    setResult(null);
    setText("");
    setError(null);
    setTopicIndex((index) => index + 1);
  }

  if (result) return <ResultView result={result} onAgain={again} />;

  const micSupported = typeof window !== "undefined" && createRecognition() !== null;

  return (
    <form onSubmit={submit} className="sheet space-y-5 p-5 md:p-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-faint">{t("talk.topicLabel")}</p>
        <p className="ltr-text text-xl leading-9">{topic.prompt}</p>
        <button
          type="button"
          onClick={() => setTopicIndex((index) => index + 1)}
          className="min-h-11 text-sm text-ink-soft underline underline-offset-4"
        >
          {t("talk.another")}
        </button>
      </div>

      <div>
        <label htmlFor="talk-text" className="sr-only">
          {t("talk.placeholder")}
        </label>
        <textarea
          id="talk-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("talk.placeholder")}
          rows={6}
          maxLength={MAX_CHARS}
          spellCheck={false}
          className="field ltr-text text-lg"
        />
        <p className="mt-1 text-end text-xs text-ink-faint">
          {text.length} / {MAX_CHARS}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TagButton type="submit" gradient loading={busy} disabled={text.trim().length === 0}>
          {t("talk.submit")}
        </TagButton>
        {micSupported && (
          <TagButton quiet onClick={toggleMic}>
            {listening ? t("talk.micStop") : t("talk.mic")}
          </TagButton>
        )}
      </div>

      {busy && <p className="text-ink-soft">{t("tutor.thinking")}</p>}
      {error && (
        <p role="alert" className="pen-error text-pen-red">
          {t(error)}
        </p>
      )}
    </form>
  );
}

export function LevelBar({ label, level }: { label: string; level: number }) {
  const filled = Math.round(level);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{label}</span>
        <span className="ltr-text text-sm font-semibold text-indigo">{bandLabel(level)}</span>
      </div>
      <div className="mt-1 flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-2 flex-1 rounded-full ${n <= filled ? "bg-[image:var(--grad)]" : "bg-paper-deep"}`} />
        ))}
      </div>
    </div>
  );
}

function ResultView({ result, onAgain }: { result: Result; onAgain: () => void }) {
  const { t } = useT();
  const { analysis, xpGained, wordsUsed } = result;
  return (
    <div className="space-y-5" aria-live="polite">
      <section className="sheet space-y-4 p-5 md:p-6">
        <h2 className="text-xl font-bold">{t("talk.resultTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <LevelBar label={t("talk.vocabulary")} level={analysis.vocabularyLevel} />
          <LevelBar label={t("talk.grammar")} level={analysis.grammarLevel} />
          <LevelBar label={t("talk.clarity")} level={analysis.clarityLevel} />
        </div>
        <RichText text={analysis.feedbackAr} />
        {xpGained > 0 && <p className="font-semibold text-leaf">{t("talk.xp", { n: xpGained })}</p>}
      </section>

      {wordsUsed && (
        <section className="sheet space-y-2 p-5 md:p-6">
          <h3 className="font-bold">{t("talk.wordsTitle", { a: wordsUsed.used.length, b: wordsUsed.target.length })}</h3>
          <ul className="ltr-text flex flex-wrap gap-2">
            {wordsUsed.target.map((word) => {
              const used = wordsUsed.used.includes(word);
              return (
                <li key={word} className={`rounded-full px-3 py-1 text-sm font-medium ${used ? "bg-[#d9f5e6] text-leaf" : "bg-paper-deep text-ink-faint"}`}>
                  {used ? "✓ " : ""}
                  {word}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="sheet space-y-3 p-5 md:p-6">
        <h3 className="font-bold">{t("talk.mistakes")}</h3>
        {analysis.mistakes.length === 0 ? (
          <p className="text-leaf">{t("talk.noMistakes")}</p>
        ) : (
          <ul className="space-y-4">
            {analysis.mistakes.map((mistake, index) => (
              <li key={index} className="space-y-1 border-s-4 border-violet ps-4">
                <p className="ltr-text">
                  <span className="text-pen-red line-through">{mistake.original}</span>
                  {"  →  "}
                  <span className="font-semibold text-leaf">{mistake.fixed}</span>
                </p>
                <p className="text-xs font-semibold text-ink-faint">{t(`talk.type.${mistake.type}` as DictKey)}</p>
                <RichText text={mistake.explanationAr} className="text-ink-soft" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sheet space-y-2 p-5 md:p-6">
        <h3 className="font-bold">{t("talk.natural")}</h3>
        <p className="ltr-text leading-8">{analysis.naturalVersion}</p>
      </section>

      <TagButton gradient onClick={onAgain}>
        {t("talk.again")}
      </TagButton>
    </div>
  );
}
