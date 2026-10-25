"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BoMark } from "@/components/bo-mark";
import { TagButton } from "@/components/tag-button";
import { useBoCompanion } from "@/components/bo-companion-context";
import { guideKey } from "@/features/bo/companion-state";
import { clampPosition, nextToTarget, EDGE } from "@/features/bo/placement";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface Step {
  /** Value of the data-tour attribute on the element Bo flies to. No target: Bo stands above the card. */
  target?: string;
  text: DictKey;
  /** Bo goes back to his own corner for this step, to show where he lives. */
  home?: boolean;
}

const STEPS: Step[] = [
  { text: "tour.welcome" },
  { target: "today", text: "tour.today" },
  { target: "path", text: "tour.path" },
  { target: "practice", text: "tour.practice" },
  { target: "words", text: "tour.words" },
  { target: "lexa", text: "tour.lexa" },
  { target: "progress", text: "tour.progress" },
  { text: "tour.review" },
  { text: "tour.me", home: true },
];

function seen(userId: string): boolean {
  try {
    return localStorage.getItem(guideKey(userId)) === "1";
  } catch {
    return true; // Storage is blocked: better to skip than to repeat the guide on every page.
  }
}

function remember(userId: string) {
  try {
    localStorage.setItem(guideKey(userId), "1");
  } catch {
    // The guide may show again next time.
  }
}

/**
 * Bo guides a new student: he flies to each part of the app and says what it is for.
 * It starts by itself the first time an account opens the app, and again from Bo's menu or the page menu.
 */
export function BoGuide({ userId, name }: { userId: string; name: string }) {
  const { t } = useT();
  const { setGuiding, setFlyTo, setMood, size, guideRequest } = useBoCompanion();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    remember(userId);
    setStep(null);
    setFlyTo(null);
    setGuiding(false);
    setMood("happy", 2500);
  }, [userId, setFlyTo, setGuiding, setMood]);

  const begin = useCallback(() => {
    setGuiding(true);
    setMood("happy");
    setStep(0);
  }, [setGuiding, setMood]);

  // The first visit of an account.
  useEffect(() => {
    if (seen(userId)) return;
    const timer = window.setTimeout(begin, 1100);
    return () => window.clearTimeout(timer);
  }, [userId, begin]);

  // Asked for from the menu.
  useEffect(() => {
    if (guideRequest > 0) begin();
  }, [guideRequest, begin]);

  const place = useCallback(() => {
    if (step === null) return;
    const current = STEPS[step];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const element = current.target ? document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`) : null;
    setRect(element ? element.getBoundingClientRect() : null);

    if (current.home) {
      setFlyTo(null);
    } else if (element) {
      setFlyTo(nextToTarget(element.getBoundingClientRect(), viewport, size));
    } else if (cardRef.current) {
      const card = cardRef.current.getBoundingClientRect();
      setFlyTo(clampPosition({ x: card.left + card.width / 2 - size / 2, y: card.top - size + 14 }, viewport, size));
    }
  }, [step, size, setFlyTo]);

  useLayoutEffect(() => {
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [place]);

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

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const pointsAtTarget = rect !== null;
  const cardAtTop = pointsAtTarget && rect.top + rect.height / 2 > window.innerHeight / 2;
  const first = name.split(" ")[0] ?? "";
  const text = current.text === "tour.welcome" && !first ? t("tour.welcomeAnon") : t(current.text, { name: first });

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t("tour.replay")}>
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[var(--r-md)] ring-4 ring-cyan transition-all duration-300"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 9999px rgba(16, 34, 79, 0.6)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-ink/60" />
      )}

      <div
        ref={cardRef}
        className={`absolute inset-x-4 mx-auto max-w-md rounded-[var(--r-lg)] bg-sheet p-5 shadow-[var(--shadow-2)] ${
          pointsAtTarget ? (cardAtTop ? "top-4" : "bottom-4") : "top-1/2 -translate-y-1/2"
        }`}
        style={pointsAtTarget ? undefined : { marginTop: EDGE }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-bold text-indigo">
            <BoMark size={26} />
            {t("brand.ai")}
          </p>
          <p className="text-xs font-semibold text-ink-faint">{t("tour.step", { a: step + 1, b: STEPS.length })}</p>
        </div>
        <p className="mt-3 text-lg leading-8" aria-live="polite">
          {text}
        </p>
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
  const { startGuide } = useBoCompanion();
  return (
    <button type="button" className={className} onClick={startGuide}>
      {t("tour.replay")}
    </button>
  );
}
