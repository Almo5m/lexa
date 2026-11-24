"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { BoMascot } from "@/components/bo-mascot";
import { RichText } from "@/components/rich-text";
import { PlanBadge, UsageMeter } from "@/components/chat-usage";
import { fetchAi } from "@/lib/fetch-ai";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface Message {
  role: "student" | "tutor";
  text: string;
}

interface Props {
  conversationId: string;
  initialMessages: Message[];
  studentCount: number;
  maxPerConversation: number;
  used: number;
  limit: number;
  plan: "free" | "plus";
  plusDays: number;
  hasMemory: boolean;
}

const MAX_LENGTH = 600;
const STARTERS: DictKey[] = ["chat.s1", "chat.s2", "chat.s3", "chat.s4"];
const KNOWN_ERRORS: Record<string, DictKey> = {
  chat_limit_reached: "bochat.limitReached",
  conversation_full: "bochat.full",
  chat_not_ready: "bochat.setup",
  ai_feature_disabled: "tutor.disabled",
  ai_busy: "tutor.busy",
  ai_unavailable: "tutor.unavailable",
};

/** The conversation screen: Bo on top, the messages, and the composer. Counters come from the server headers. */
export function ChatRoom(props: Props) {
  const { t } = useT();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(props.initialMessages);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"idle" | "thinking" | "writing">("idle");
  const [error, setError] = useState<DictKey | null>(null);
  const [used, setUsed] = useState(props.used);
  const [count, setCount] = useState(props.studentCount);
  const [starting, setStarting] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const stopRef = useRef<AbortController | null>(null);

  const full = count >= props.maxPerConversation;
  const outOfMessages = used >= props.limit;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, busy, error]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy !== "idle" || full || outOfMessages) return;
    setError(null);
    setDraft("");
    const history: Message[] = [...messages, { role: "student", text: clean }];
    setMessages(history);
    setBusy("thinking");
    const stop = new AbortController();
    stopRef.current = stop;
    let reply = "";
    try {
      const response = await fetchAi("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: props.conversationId, text: clean }),
        signal: stop.signal,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessages(messages);
        setDraft(clean);
        setError(KNOWN_ERRORS[data.error] ?? "tutor.error");
        if (data.error === "chat_limit_reached") setUsed(props.limit);
        if (data.error === "conversation_full") setCount(props.maxPerConversation);
        return;
      }
      setUsed(Number(response.headers.get("X-Chat-Used") ?? used + 1));
      setCount(Number(response.headers.get("X-Chat-Count") ?? count + 1));
      const reader = response.body?.getReader();
      if (!reader) throw new Error("no_body");
      const decoder = new TextDecoder();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          setBusy("writing");
          setMessages([...history, { role: "tutor", text: reply }]);
        }
      } catch {
        // A cut connection keeps what arrived (the server saved it too).
        if (!reply && !stop.signal.aborted) setError("tutor.error");
      }
      void fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: props.conversationId }),
      }).catch(() => undefined);
    } catch {
      if (!stop.signal.aborted) {
        setMessages(messages);
        setDraft(clean);
        setError("tutor.error");
      }
    } finally {
      stopRef.current = null;
      setBusy("idle");
    }
  }

  async function continueNew() {
    setStarting(true);
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: props.conversationId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      router.push(`/chat/${data.id}`);
    } catch {
      setError("tutor.error");
      setStarting(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  }

  const mood = busy === "idle" ? (error ? "sad" : "happy") : "thinking";
  const status = busy === "thinking" ? "chat.status.thinking" : busy === "writing" ? "chat.status.writing" : props.hasMemory ? "bochat.memory" : "chat.subtitle";

  return (
    <div className="flex h-[calc(100dvh-9rem)] max-w-3xl flex-col gap-3 lg:h-[calc(100dvh-4rem)]">
      <div className="sheet flex items-center gap-3 rounded-[28px] p-3">
        <BoMascot mood={mood} size={88} className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href="/chat" className="text-sm font-medium text-indigo">{t("bochat.back")}</Link>
            <PlanBadge plan={props.plan} days={props.plusDays} />
          </div>
          <p className="text-sm text-ink-soft" aria-live="polite">{t(status, { ai: "بو" })}</p>
          <UsageMeter used={used} limit={props.limit} />
        </div>
      </div>

      <div ref={scroller} className="sheet min-h-0 flex-1 space-y-3 overflow-y-auto rounded-[28px] p-4" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-ink-soft">{t("chat.empty", { ai: "بو" })}</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((key) => (
                <button key={key} type="button" onClick={() => void send(t(key))} className="min-h-11 rounded-full px-4 text-sm shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep">
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 leading-7 ${message.role === "student" ? "rounded-ee-md bg-indigo text-white" : "rounded-es-md bg-paper-deep"}`}>
              {message.role === "student" ? <p dir="auto">{message.text}</p> : <RichText text={message.text} />}
            </div>
          </div>
        ))}
        {error && <p role="alert" className="rounded-2xl bg-pen-red/10 px-4 py-3 text-sm text-pen-red">{t(error)}</p>}
        {outOfMessages && !full && (
          <p className="rounded-2xl bg-cream px-4 py-3 text-sm">
            {t("bochat.limitReached")}{" "}
            <Link href="/plus" className="font-semibold text-indigo">{t("bochat.seePlus")}</Link>
          </p>
        )}
      </div>

      {full ? (
        <div className="sheet space-y-2 rounded-[28px] p-4 text-center">
          <p className="font-bold">{t("bochat.full")}</p>
          <p className="text-sm text-ink-soft">{t("bochat.fullHint")}</p>
          <button type="button" onClick={continueNew} disabled={starting} className="tag-btn min-h-11 text-sm disabled:opacity-50">
            {t("bochat.continue")}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="sheet flex items-end gap-2 rounded-[28px] p-3">
          <label htmlFor="chat-draft" className="sr-only">{t("bochat.placeholder")}</label>
          <textarea
            id="chat-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder={t("bochat.placeholder")}
            disabled={outOfMessages}
            className="field max-h-32 min-h-11 flex-1 resize-none"
          />
          <button type="submit" disabled={busy !== "idle" || draft.trim() === "" || outOfMessages} className="tag-btn min-h-11 text-sm disabled:opacity-50">
            {t("bochat.send")}
          </button>
        </form>
      )}
      <p className="text-center text-xs text-ink-faint">{t("bochat.convLeft", { a: Math.min(count, props.maxPerConversation), b: props.maxPerConversation })}</p>
    </div>
  );
}
