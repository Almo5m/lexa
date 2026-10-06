"use client";

import { useState } from "react";
import { RevealIcon } from "@/components/icons";
import { SpeakButton } from "@/components/speak-button";
import { useT } from "@/lib/i18n/provider";
import type { WordCard } from "@/features/ai/schemas";

interface Props {
  card: WordCard;
  startRevealed?: boolean;
  onRevealChange?: (revealed: boolean) => void;
}

export function WordCardView({ card, startRevealed = false, onRevealChange }: Props) {
  const { t } = useT();
  const [revealed, setRevealed] = useState(startRevealed);

  return (
    <article className="sheet space-y-6 p-6 md:p-8">
      <header className="flex items-start justify-between gap-4">
        <div className="ltr-text">
          <h2 className="text-4xl font-semibold tracking-tight">{card.term}</h2>
          <p className="mt-1 font-[family-name:var(--font-ipa)] text-ink-soft">
            {card.ipa} <span className="text-ink-faint">· {card.partOfSpeech}</span>
          </p>
        </div>
        <SpeakButton text={card.term} label={t("card.listen")} />
      </header>

      <div className="flex items-start gap-3">
        <p className="ltr-text flex-1 text-xl leading-9">{card.sentence}</p>
        <SpeakButton text={card.sentence} label={t("card.listenSentence")} size="small" />
      </div>

      {!revealed && <p className="text-sm text-ink-faint">{t("card.guess")}</p>}

      <button
        type="button"
        onClick={() => {
          const next = !revealed;
          setRevealed(next);
          onRevealChange?.(next);
        }}
        aria-expanded={revealed}
        className="inline-flex min-h-12 items-center gap-2 rounded-md px-1 font-medium text-ink underline underline-offset-4"
      >
        <RevealIcon open={revealed} />
        {revealed ? t("card.hide") : t("card.reveal")}
      </button>

      {revealed && (
        <div className="space-y-5 border-t border-line pt-5">
          <p className="marker inline px-1 text-2xl">{card.meaningsAr.join("، ")}</p>
          <p className="text-ink-soft">{card.sentenceAr}</p>

          <Block title={t("card.situation")}>{card.situationAr}</Block>
          <Block title={t("card.usage")}>{card.usageNoteAr}</Block>

          {card.extraExamples.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">{t("card.more")}</h3>
              <ul className="space-y-3">
                {card.extraExamples.map((example) => (
                  <li key={example.en}>
                    <p className="ltr-text">{example.en}</p>
                    <p className="text-sm text-ink-soft">{example.ar}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {card.related.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">{t("card.related")}</h3>
              <ul className="space-y-1">
                {card.related.map((item) => (
                  <li key={item.word}>
                    <span className="ltr-text inline-block font-medium">{item.word}</span>
                    <span className="text-ink-soft"> — {item.noteAr}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {card.confusableWith && (
            <div className="rounded-md border-s-4 border-marker-deep bg-paper-deep/60 p-4">
              <h3 className="font-semibold">
                {t("card.confusable")} <span className="ltr-text inline-block">{card.confusableWith.word}</span>
              </h3>
              <p className="mt-1 text-ink-soft">{card.confusableWith.differenceAr}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Block({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-ink-soft">{children}</p>
    </div>
  );
}
