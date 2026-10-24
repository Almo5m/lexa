"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LexaMascot } from "@/components/lexa-mascot";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

const STORAGE_KEY = "lexa-tour-v1";
export const START_TOUR_EVENT = "lexa-start-tour";

interface Step {
  /** Value of the data-tour attribute on the element to point at. No target means a centered card. */
  target?: string;
  text: DictKey;
}

const STEPS: Step[] = [
  { text: "tour.welcome" },
  { target: "path", text: "tour.path" },
  { target: "practice", text: "tour.practice" },
  { target: "words", text: "tour.words" },
  { target: "lexa", text: "tour.lexa" },
  { target: "progress", text: "tour.progress" },
  { text: "tour.review" },
];

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Private mode or blocked storage: the tour just shows again next time.
  }
}

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

/** A short first-run tour. Replayable from the menu. Points at real elements through data-tour attributes. */
export function AppTour() {
  const { t } = useT();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    remember();
    setStep(null);
  }, []);

  useEffect(() => {
    const start = () => setStep(0);
    window.addEventListener(START_TOUR_EVENT, start);
    const timer = alreadySeen() ? null : window.setTimeout(start, 900);
    return () => {
      window.removeEventListener(START_TOUR_EVENT, start);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const measure = useCallback(() => {
    if (step === null) return;
    const target = STEPS[step].target;
    const element = target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null;
    if (!element) {
      setRect(null);
      return;
    }
    element.scrollIntoView({ block: "nearest", inline: "nearest" });
    setRect(element.getBoundingClientRect());
  }, [step]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (step === null) return;
    nextRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, close]);

  if (step === null) return null;

  const last = step === STEPS.length - 1;
  const pointsAtTarget = rect !== null;
  const cardAtTop = pointsAtTarget && rect.top + rect.height / 2 > window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t("tour.replay")}>
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[var(--r-md)] ring-4 ring-cyan transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(26, 16, 102, 0.6)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-ink/60" />
      )}

      <div
        className={`absolute inset-x-4 mx-auto max-w-md rounded-[var(--r-lg)] bg-sheet p-5 shadow-[var(--shadow-2)] ${
          pointsAtTarget ? (cardAtTop ? "top-4" : "bottom-4") : "top-1/2 -translate-y-1/2"
        }`}
      >
        <div className="flex items-start gap-4">
          <LexaMascot mood="happy" size={64} />
          <div className="flex-1">
            <p className="text-xs font-semibold text-ink-faint">
              {t("tour.step", { a: step + 1, b: STEPS.length })}
            </p>
            <p className="mt-1 text-lg leading-8" aria-live="polite">
              {t(STEPS[step].text)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={close} className="min-h-11 px-2 text-sm text-ink-soft underline underline-offset-4">
            {t("tour.skip")}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <TagButton quiet onClick={() => setStep(step - 1)}>
                {t("tour.back")}
              </TagButton>
            )}
            <button
              ref={nextRef}
              type="button"
              className="tag-btn tag-btn-grad"
              onClick={() => (last ? close() : setStep(step + 1))}
            >
              {last ? t("tour.done") : t("tour.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TourReplayButton({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}>
      {t("tour.replay")}
    </button>
  );
}
