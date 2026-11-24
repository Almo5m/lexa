/** Speaking: picks the best voice the device has, reads long text in pieces, remembers speed and voice per device. */
import { segmentByScript, type Segment, type SpeechLang } from "@/lib/voice/text";

export type VoiceSpeed = "slow" | "normal" | "fast";
const RATES: Record<VoiceSpeed, number> = { slow: 0.7, normal: 0.92, fast: 1.1 };
const SPEED_KEY = "booo.voice.speed";
const VOICE_KEY = "booo.voice.uri";
const NATURAL = /natural|neural|online|premium|enhanced|google|samantha|aria|jenny|guy|daniel|karen|serena/i;
const POOR = /compact|espeak|novelty|zarvox|bells|whisper|trinoids|albert|bad news|good news|bahh|bubbles|cellos|organ/i;

export function supportsSpeaking(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getSpeed(): VoiceSpeed {
  try {
    const saved = window.localStorage.getItem(SPEED_KEY);
    if (saved === "slow" || saved === "normal" || saved === "fast") return saved;
  } catch {
    // storage blocked: use the default
  }
  return "normal";
}
export function setSpeed(speed: VoiceSpeed): void {
  try {
    window.localStorage.setItem(SPEED_KEY, speed);
  } catch {
    // not saving is fine
  }
}
export function getSavedVoiceUri(): string | null {
  try {
    return window.localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}
export function setSavedVoiceUri(uri: string | null): void {
  try {
    if (uri) window.localStorage.setItem(VOICE_KEY, uri);
    else window.localStorage.removeItem(VOICE_KEY);
  } catch {
    // not saving is fine
  }
}

/** Voices load late on some browsers: resolve as soon as the list is not empty (or after a short wait). */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!supportsSpeaking()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener?.("voiceschanged", done, { once: true });
    window.setTimeout(done, 1200);
  });
}

function score(voice: SpeechSynthesisVoice, lang: SpeechLang): number {
  const code = voice.lang.replace("_", "-").toLowerCase();
  let value = 0;
  if (lang === "en") {
    if (code === "en-us") value += 30;
    else if (code === "en-gb") value += 24;
    else if (code.startsWith("en")) value += 12;
    else return -1;
  } else {
    if (code === "ar-eg") value += 30;
    else if (code.startsWith("ar")) value += 20;
    else return -1;
  }
  if (NATURAL.test(voice.name)) value += 15;
  if (!voice.localService) value += 4;
  if (POOR.test(voice.name)) value -= 25;
  return value;
}

export function englishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices.filter((voice) => score(voice, "en") > 0).sort((a, b) => score(b, "en") - score(a, "en"));
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: SpeechLang, savedUri: string | null = null): SpeechSynthesisVoice | null {
  if (lang === "en" && savedUri) {
    const saved = voices.find((voice) => voice.voiceURI === savedUri);
    if (saved) return saved;
  }
  const ranked = voices.filter((voice) => score(voice, lang) > 0).sort((a, b) => score(b, lang) - score(a, lang));
  return ranked[0] ?? null;
}

export function stopSpeaking(): void {
  if (supportsSpeaking()) window.speechSynthesis.cancel();
}

export interface SpeakOptions {
  speed?: VoiceSpeed;
  onEnd?: () => void;
  /** Called with the index of the sentence that starts, to highlight it. */
  onSentence?: (index: number) => void;
}

/** Read text aloud. Returns false when the device cannot speak at all. */
export function speakText(input: string | Segment[], options: SpeakOptions = {}): boolean {
  if (!supportsSpeaking()) return false;
  const segments = typeof input === "string" ? segmentByScript(input) : input;
  if (segments.length === 0) {
    options.onEnd?.();
    return true;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const rate = RATES[options.speed ?? getSpeed()];
  const saved = getSavedVoiceUri();
  void loadVoices().then((voices) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      options.onEnd?.();
    };
    segments.forEach((segment, index) => {
      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.lang = segment.lang === "ar" ? "ar-EG" : "en-US";
      utterance.rate = segment.lang === "ar" ? Math.min(rate, 1) : rate;
      const voice = pickVoice(voices, segment.lang, saved);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.onstart = () => options.onSentence?.(index);
      if (index === segments.length - 1) {
        utterance.onend = finish;
      }
      utterance.onerror = (event) => {
        // "canceled"/"interrupted" come from our own cancel(): not a failure, but the caller must still be released.
        if (index === segments.length - 1 || event.error !== "interrupted") finish();
      };
      synth.speak(utterance);
    });
  });
  return true;
}
