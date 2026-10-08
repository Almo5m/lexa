"use client";

import { useRef, useState, type FormEvent } from "react";
import { ChatIcon } from "@/components/icons";
import { LexaLoader } from "@/components/lexa-loader";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface Message {
  role: "student" | "tutor";
  text: string;
}

export function TutorChat({ wordId }: { wordId?: string }) {
  const { t } = useT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next: Message[] = [...messages, { role: "student", text: clean }];
    setMessages(next);
    setDraft("");
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, messages: next.slice(-12) }),
      });
      const data = await response.json();
      if (!response.ok) {
        const known: Record<string, DictKey> = {
          daily_ai_limit_reached: "tutor.limit",
          ai_feature_disabled: "tutor.disabled",
          ai_busy: "tutor.busy",
        };
        setError(t(known[data.error] ?? "tutor.error"));
        return;
      }
      setMessages([...next, { role: "tutor", text: data.reply }]);
      queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    } catch {
      setError(t("tutor.error"));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  const quick: DictKey[] = ["tutor.simpler", "tutor.another", "tutor.compare"];

  return (
    <section aria-labelledby="tutor-title" className="sheet space-y-4 p-5 md:p-6">
      <h2 id="tutor-title" className="flex items-center gap-2 text-lg font-semibold">
        <ChatIcon />
        {t("tutor.title")}
      </h2>

      <div className="space-y-3" aria-live="polite">
        {messages.length === 0 && <p className="text-ink-soft">{t("tutor.intro")}</p>}
        {messages.map((message, index) => (
          <p
            key={index}
            className={`max-w-[92%] whitespace-pre-wrap rounded-lg px-4 py-2 ${
              message.role === "student"
                ? "ms-auto bg-paper-deep"
                : "border border-line bg-sheet"
            }`}
          >
            {message.text}
          </p>
        ))}
        {busy && (
          <div className="flex items-center gap-3 text-ink-faint">
            <LexaLoader size={56} label={t("tutor.thinking")} />
            <span aria-hidden="true">{t("tutor.thinking")}</span>
          </div>
        )}
        {error && (
          <p role="alert" className="pen-error text-pen-red">
            {error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {wordId && (
        <div className="flex flex-wrap gap-2">
          {quick.map((key) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => void send(t(key))}
              className="min-h-11 rounded-full px-4 text-sm shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep disabled:opacity-50"
            >
              {t(key)}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <label htmlFor="tutor-input" className="sr-only">
          {t("tutor.placeholder")}
        </label>
        <textarea
          id="tutor-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("tutor.placeholder")}
          rows={2}
          maxLength={600}
          className="field flex-1"
        />
        <TagButton type="submit" loading={busy} disabled={draft.trim().length === 0}>
          {t("tutor.send")}
        </TagButton>
      </form>
    </section>
  );
}
