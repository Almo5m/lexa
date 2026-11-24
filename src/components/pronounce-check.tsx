"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { speechMatch } from "@/lib/voice/text";
import { listen, supportsListening, type Listener, type ListenError } from "@/lib/voice/stt";

/** "Say it": the student says the word or sentence and sees how close it was. Nothing is saved or sent anywhere. */
export function PronounceCheck({ target }: { target: string }) {
  const { t } = useT();
  const [state, setState] = useState<"idle" | "listening">("idle");
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<ListenError | null>(null);
  const [supported, setSupported] = useState(false);
  const listener = useRef<Listener | null>(null);

  useEffect(() => {
    setSupported(supportsListening());
    return () => listener.current?.abort();
  }, []);

  if (!supported) return null;

  function start() {
    if (state === "listening") {
      listener.current?.stop();
      return;
    }
    setHeard("");
    setScore(null);
    setError(null);
    setState("listening");
    listener.current = listen({
      onInterim: setHeard,
      onFinal: (text) => {
        setHeard(text);
        setScore(speechMatch(target, text));
      },
      onError: setError,
      onEnd: () => setState("idle"),
    });
    if (!listener.current) setState("idle");
  }

  const verdict: DictKey | null = score === null ? null : score >= 0.85 ? "voice.say.great" : score >= 0.5 ? "voice.say.close" : "voice.say.again";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={start}
        aria-pressed={state === "listening"}
        className={`min-h-11 rounded-full px-4 text-sm font-medium ${state === "listening" ? "bg-pen-red text-white" : "shadow-[inset_0_0_0_2px_var(--color-ink)] hover:bg-paper-deep"}`}
      >
        {state === "listening" ? t("voice.listening") : t("voice.say")}
      </button>
      <div aria-live="polite" className="space-y-1 text-sm">
        {heard && <p dir="ltr" className="text-left text-ink-soft">“{heard}”</p>}
        {verdict && (
          <p className={score !== null && score >= 0.85 ? "font-bold text-leaf" : "font-medium"}>{t(verdict)}</p>
        )}
        {error && <p role="alert" className="text-pen-red">{t(`voice.err.${error}` as DictKey)}</p>}
      </div>
    </div>
  );
}
