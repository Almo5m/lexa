"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { BoRobot } from "@/components/bo-robot";
import { BoMark } from "@/components/bo-mark";
import { CloseIcon } from "@/components/icons";
import { RichText } from "@/components/rich-text";
import { useBoCompanion } from "@/components/bo-companion-context";
import { fetchAi } from "@/lib/fetch-ai";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface Message {
  role: "student" | "tutor";
  text: string;
}

/** What Bo is doing right now. The labels are honest: sending, waiting for the model, then streaming the answer. */
type Phase = "idle" | "reading" | "thinking" | "writing";

const READING_MS = 700;
const MAX_LENGTH = 600;
const STARTERS: DictKey[] = ["chat.s1", "chat.s2", "chat.s3", "chat.s4"];
const FOR_WORD: DictKey[] = ["tutor.simpler", "tutor.another", "tutor.compare"];

const KNOWN_ERRORS: Record<string, DictKey> = {
  daily_ai_limit_reached: "tutor.limit",
  ai_feature_disabled: "tutor.disabled",
  ai_busy: "tutor.busy",
  ai_unavailable: "tutor.unavailable",
};

interface BoChatProps {
  /** Opens the chat about one word, with the quick questions for it. */
  wordId?: string;
  /** sheet: fills the bottom sheet with the composer pinned. inline: a card inside a page. */
  layout?: "sheet" | "inline";
  onClose?: () => void;
}

export function BoChat({ wordId, layout = "inline", onClose }: BoChatProps) {
  const { t } = useT();
  const { setMood } = useBoCompanion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<DictKey | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const stopRef = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const sheet = layout === "sheet";
  const busy = phase !== "idle";

  const moveTo = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, phase, error]);

  // The input grows with the text, up to a few lines.
  useEffect(() => {
    const element = input.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 132)}px`;
  }, [draft]);

  async function ask(history: Message[]) {
    setError(null);
    moveTo("reading");
    setMood("thinking");
    const stop = new AbortController();
    stopRef.current = stop;
    const timer = window.setTimeout(() => {
      if (phaseRef.current === "reading") moveTo("thinking");
    }, READING_MS);

    let reply = "";
    try {
      const response = await fetchAi("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId, messages: history.slice(-12) }),
        signal: stop.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(KNOWN_ERRORS[data.error] ?? "tutor.error");
        setMood("sad", 4000);
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        setError("tutor.error");
        setMood("sad", 4000);
        return;
      }
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          if (phaseRef.current !== "writing") moveTo("writing");
          setMessages([...history, { role: "tutor", text: reply }]);
        }
        setMood("happy", 2500);
      } catch {
        // A cut connection or the stop button keeps what already arrived. Only an empty answer is an error.
        if (!reply && !stop.signal.aborted) {
          setError("tutor.error");
          setMood("sad", 4000);
        } else setMood("neutral");
      }
    } catch {
      if (!stop.signal.aborted) {
        setError("tutor.error");
        setMood("sad", 4000);
      } else setMood("neutral");
    } finally {
      window.clearTimeout(timer);
      stopRef.current = null;
      moveTo("idle");
      if (sheet) input.current?.focus();
    }
  }

  function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next: Message[] = [...messages, { role: "student", text: clean }];
    setMessages(next);
    setDraft("");
    void ask(next);
  }

  function retry() {
    if (busy || messages[messages.length - 1]?.role !== "student") return;
    void ask(messages);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  }

  async function copy(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text.replace(/\*\*/g, ""));
      setCopied(index);
      window.setTimeout(() => setCopied((current) => (current === index ? null : current)), 1600);
    } catch {
      // Clipboard can be blocked; nothing to show.
    }
  }

  function startOver() {
    stopRef.current?.abort();
    setMessages([]);
    setError(null);
    setDraft("");
  }

  const lastIndex = messages.length - 1;
  const waitingForFirstWord = phase === "reading" || phase === "thinking";
  const statusKey: DictKey =
    phase === "reading" ? "chat.status.reading" : phase === "thinking" ? "chat.status.thinking" : phase === "writing" ? "chat.status.writing" : "chat.subtitle";
  const chips = wordId ? FOR_WORD : STARTERS;
  const robotMood = phase === "idle" ? "happy" : phase === "writing" ? "happy" : "thinking";

  return (
    <section
      aria-label={t("brand.ai")}
      className={sheet ? "flex min-h-0 flex-1 flex-col" : "sheet flex flex-col overflow-hidden"}
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <BoRobot size={52} mood={robotMood} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-tight">{t("brand.ai")}</h2>
          <p key={statusKey} className={`chat-status truncate text-sm ${busy ? "font-semibold text-indigo" : "text-ink-soft"}`} aria-live="polite">
            {t(statusKey)}
            {busy && <span className="dots chat-status-dots" aria-hidden="true"><span /><span /><span /></span>}
          </p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={startOver} aria-label={t("chat.new")} title={t("chat.new")} className="flex h-11 w-11 items-center justify-center rounded-full text-indigo hover:bg-paper-deep">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper-deep">
            <CloseIcon />
          </button>
        )}
      </header>

      <div
        ref={scroller}
        aria-live="polite"
        className={`space-y-4 overflow-y-auto px-4 py-4 ${sheet ? "min-h-0 flex-1" : "max-h-[60dvh] min-h-48"}`}
      >
        {messages.length === 0 && (
          <div className="chat-empty space-y-4 text-center">
            <p className="mx-auto max-w-sm text-ink-soft">{wordId ? t("tutor.intro") : t("chat.empty")}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {chips.map((key) => (
                <button key={key} type="button" disabled={busy} onClick={() => send(t(key))} className="chat-chip">
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const isLast = index === lastIndex;
          if (message.role === "student") {
            const reading = isLast && phase === "reading";
            const read = isLast && (phase === "thinking" || phase === "writing");
            return (
              <div key={index} className="flex flex-col items-end gap-1">
                <p className={`chat-bubble chat-bubble-me ${reading ? "read-sweep" : ""}`} dir="auto">
                  {message.text}
                </p>
                {(read || (!isLast && messages[index + 1])) && (
                  <span className="chat-read" aria-label={t("chat.read")}>
                    <span aria-hidden="true">✓✓</span> {t("chat.read")}
                  </span>
                )}
              </div>
            );
          }
          const streaming = isLast && phase === "writing";
          return (
            <div key={index} className="flex items-start gap-2">
              <BoMark size={32} className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="chat-bubble chat-bubble-bo">
                  <RichText text={message.text} />
                  {streaming && <span className="chat-caret" aria-hidden="true" />}
                </div>
                {!streaming && (
                  <button type="button" onClick={() => void copy(index, message.text)} className="chat-action">
                    {copied === index ? t("chat.copied") : t("chat.copy")}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {waitingForFirstWord && (
          <div className="flex items-start gap-2" role="status">
            <span className="chat-orb mt-1 shrink-0" aria-hidden="true">
              <BoMark size={26} />
            </span>
            <div className="chat-bubble chat-bubble-bo w-full max-w-[16rem] space-y-2.5 py-3.5">
              <span className="sr-only">{t(statusKey)}</span>
              <span className="skeleton-line" style={{ width: "92%" }} aria-hidden="true" />
              <span className="skeleton-line" style={{ width: "70%" }} aria-hidden="true" />
              <span className="skeleton-line" style={{ width: "46%" }} aria-hidden="true" />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-pen-red/10 px-4 py-3 text-pen-red">
            <span className="flex-1">{t(error)}</span>
            {messages[lastIndex]?.role === "student" && (
              <button type="button" onClick={retry} className="min-h-10 rounded-full bg-sheet px-4 text-sm font-semibold text-pen-red shadow-[var(--shadow-1)]">
                {t("chat.retry")}
              </button>
            )}
          </div>
        )}
      </div>

      {wordId && messages.length > 0 && !busy && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {FOR_WORD.map((key) => (
            <button key={key} type="button" onClick={() => send(t(key))} className="chat-chip">
              {t(key)}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="chat-composer">
        <label htmlFor={`bo-chat-input-${layout}`} className="sr-only">
          {t("tutor.placeholder")}
        </label>
        <textarea
          ref={input}
          id={`bo-chat-input-${layout}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("tutor.placeholder")}
          rows={1}
          maxLength={MAX_LENGTH}
          className="chat-input"
        />
        {draft.length > MAX_LENGTH - 120 && (
          <span className="chat-counter" aria-hidden="true">
            {draft.length}/{MAX_LENGTH}
          </span>
        )}
        {busy ? (
          <button type="button" onClick={() => stopRef.current?.abort()} className="chat-send chat-stop" aria-label={t("chat.stop")}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" /></svg>
          </button>
        ) : (
          <button type="submit" disabled={draft.trim().length === 0} className="chat-send" aria-label={t("tutor.send")}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="chat-send-icon">
              <path d="M12 19V6M6 11l6-6 6 6" />
            </svg>
          </button>
        )}
      </form>
    </section>
  );
}
