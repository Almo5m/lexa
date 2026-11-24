"use client";

import { useEffect, useState } from "react";
import { SpeakerIcon } from "@/components/icons";
import { useT } from "@/lib/i18n/provider";
import { speakText, stopSpeaking, supportsSpeaking } from "@/lib/voice/tts";

export function speak(text: string, onEnd?: () => void): boolean {
  return speakText(text, { onEnd });
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
    setSupported(supportsSpeaking());
    return () => stopSpeaking();
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
