/** Listening to the student: one small wrapper over the browser's speech recognition. */

interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export type ListenError = "denied" | "no_speech" | "no_mic" | "network" | "other";

function ctor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, (new () => RecognitionLike) | undefined>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function supportsListening(): boolean {
  return ctor() !== null;
}

function mapError(code: string | undefined): ListenError {
  if (code === "not-allowed" || code === "service-not-allowed") return "denied";
  if (code === "no-speech") return "no_speech";
  if (code === "audio-capture") return "no_mic";
  if (code === "network") return "network";
  return "other";
}

export interface Listener {
  stop: () => void;
  abort: () => void;
}

export interface ListenOptions {
  lang?: "en-US" | "ar-EG";
  /** Live text while the student is still talking. */
  onInterim?: (text: string) => void;
  /** The finished sentence(s). Called once, when listening ends with something heard. */
  onFinal: (text: string) => void;
  onError?: (error: ListenError) => void;
  onEnd?: () => void;
}

/** Start listening. Stops by itself after the student pauses; returns null when the browser has no recognition. */
export function listen(options: ListenOptions): Listener | null {
  const Recognition = ctor();
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = options.lang ?? "en-US";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  let finalText = "";
  let failed = false;
  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const piece = event.results[i][0]?.transcript ?? "";
      if (event.results[i].isFinal) finalText += `${finalText ? " " : ""}${piece.trim()}`;
      else interim += piece;
    }
    options.onInterim?.(`${finalText} ${interim}`.trim());
  };
  recognition.onerror = (event) => {
    failed = true;
    options.onError?.(mapError(event.error));
  };
  recognition.onend = () => {
    if (finalText && !failed) options.onFinal(finalText.trim());
    else if (!failed) options.onError?.("no_speech");
    options.onEnd?.();
  };
  try {
    recognition.start();
  } catch {
    options.onError?.("other");
    options.onEnd?.();
    return null;
  }
  return { stop: () => recognition.stop(), abort: () => recognition.abort() };
}
