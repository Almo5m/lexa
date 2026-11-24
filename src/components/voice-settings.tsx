"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  englishVoices,
  getSavedVoiceUri,
  getSpeed,
  loadVoices,
  setSavedVoiceUri,
  setSpeed,
  speakText,
  supportsSpeaking,
  type VoiceSpeed,
} from "@/lib/voice/tts";

const SPEEDS: VoiceSpeed[] = ["slow", "normal", "fast"];

/** Speed of the voice and which English voice to use. Both are remembered on this device. */
export function VoiceSettings({ showVoice = false }: { showVoice?: boolean }) {
  const { t } = useT();
  const [speed, setSpeedState] = useState<VoiceSpeed>("normal");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");

  useEffect(() => {
    setSpeedState(getSpeed());
    setVoiceUri(getSavedVoiceUri() ?? "");
    if (supportsSpeaking()) void loadVoices().then((all) => setVoices(englishVoices(all)));
  }, []);

  if (!supportsSpeaking()) return null;

  return (
    <div className="space-y-3">
      <div role="group" aria-label={t("voice.speed")} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-soft">{t("voice.speed")}</span>
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={speed === value}
            onClick={() => {
              setSpeed(value);
              setSpeedState(value);
            }}
            className={`min-h-11 rounded-full px-4 text-sm ${speed === value ? "bg-indigo text-white" : "shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep"}`}
          >
            {t(`voice.speed.${value}` as DictKey)}
          </button>
        ))}
      </div>
      {showVoice && voices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="voice-pick" className="text-sm text-ink-soft">{t("voice.voice")}</label>
          <select
            id="voice-pick"
            dir="ltr"
            value={voiceUri}
            onChange={(event) => {
              setVoiceUri(event.target.value);
              setSavedVoiceUri(event.target.value || null);
              speakText("Hello, I am Bo. Let's learn English together.");
            }}
            className="field min-h-11 max-w-full"
          >
            <option value="">{t("voice.auto")}</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
