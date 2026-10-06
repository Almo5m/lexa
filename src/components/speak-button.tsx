"use client";

import { useEffect, useState } from "react";
import { SpeakerIcon } from "@/components/icons";
import { useT } from "@/lib/i18n/provider";

export function speak(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  const voice = window.speechSynthesis
    .getVoices()
    .find((item) => item.lang.startsWith("en-US") || item.lang.startsWith("en-GB"));
  if (voice) utterance.voice = voice;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

interface SpeakButtonProps {
  text: string;
  label: string;
  size?: "normal" | "small";
}

export function SpeakButton({ text, label, size = "normal" }: SpeakButtonProps) {
  const { t } = useT();
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const dimension = size === "small" ? "h-11 w-11" : "h-12 w-12";

  return (
    <button
      type="button"
      onClick={() => {
        setPlaying(true);
        if (!speak(text, () => setPlaying(false))) setPlaying(false);
      }}
      disabled={!supported}
      aria-label={supported ? label : t("card.noAudio")}
      title={supported ? label : t("card.noAudio")}
      className={`${dimension} inline-flex shrink-0 items-center justify-center rounded-full text-ink shadow-[inset_0_0_0_2px_var(--color-ink)] hover:bg-paper-deep disabled:opacity-50`}
    >
      <SpeakerIcon playing={playing} />
    </button>
  );
}
