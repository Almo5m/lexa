"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BoRobot } from "@/components/bo-robot";
import { BoChatHost } from "@/components/bo-chat-sheet";
import { BoGuide } from "@/components/bo-guide";
import type { BoMood } from "@/features/bo/scene";
import {
  DEFAULT_PREFS,
  readPrefs,
  writePrefs,
  type CompanionPrefs,
} from "@/features/bo/companion-state";
import { clampPosition, dockPosition, fromFractions, popoverSide, toFractions, type Point, type Viewport } from "@/features/bo/placement";
import { CompanionContext, useBoCompanion, type CompanionApi } from "@/components/bo-companion-context";
import { useT } from "@/lib/i18n/provider";

/** Pages that already show a big Bo of their own, so the floating one stays out of the way. */
const OWN_BO_PATHS = ["/", "/me"];
const PHONE_BAR = 72;
const DRAG_THRESHOLD = 6;
const KEY_STEP = 28;

export function BoCompanionProvider({ children, userId, name }: { children: ReactNode; userId: string; name: string }) {
  const [mood, setMoodState] = useState<BoMood>("neutral");
  const [bubble, setBubble] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [guiding, setGuiding] = useState(false);
  const [guideRequest, setGuideRequest] = useState(0);
  const [flyTo, setFlyTo] = useState<Point | null>(null);
  const [prefs, setPrefs] = useState<CompanionPrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ width: 360, height: 740 });
  const moodTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setPrefs(readPrefs());
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setReady(true);
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const update = useCallback((patch: Partial<CompanionPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      writePrefs(next);
      return next;
    });
  }, []);

  const setMood = useCallback((next: BoMood, ms?: number) => {
    clearTimeout(moodTimer.current);
    setMoodState(next);
    if (ms) moodTimer.current = setTimeout(() => setMoodState("neutral"), ms);
  }, []);

  const say = useCallback((text: string, ms = 4200) => {
    clearTimeout(bubbleTimer.current);
    setBubble(text);
    bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  }, []);

  const size = viewport.width < 1024 ? 76 : 96;

  const api = useMemo<CompanionApi>(
    () => ({
      mood,
      setMood,
      say,
      chatOpen,
      openChat: () => setChatOpen(true),
      closeChat: () => setChatOpen(false),
      startGuide: () => setGuideRequest((count) => count + 1),
      guiding,
      flyTo,
      setFlyTo,
      setGuiding,
      guideRequest,
      size,
      hidden: prefs.hidden,
      setHidden: (value) => update({ hidden: value }),
    }),
    [mood, setMood, say, chatOpen, guiding, flyTo, guideRequest, size, prefs.hidden, update],
  );

  return (
    <CompanionContext.Provider value={api}>
      {children}
      {ready && <FloatingBo prefs={prefs} update={update} viewport={viewport} bubble={bubble} />}
      <BoChatHost />
      <BoGuide userId={userId} name={name} />
    </CompanionContext.Provider>
  );
}

function FloatingBo({
  prefs,
  update,
  viewport,
  bubble,
}: {
  prefs: CompanionPrefs;
  update: (patch: Partial<CompanionPrefs>) => void;
  viewport: Viewport;
  bubble: string | null;
}) {
  const { t } = useT();
  const pathname = usePathname();
  const { mood, size, guiding, flyTo, openChat, startGuide, say, setHidden } = useBoCompanion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drag, setDrag] = useState<{ point: Point; tilt: number } | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: number; startX: number; startY: number; origin: Point; moved: boolean } | null>(null);

  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const phone = viewport.width < 1024;
  const reserve = { top: 0, bottom: phone ? PHONE_BAR : 0 };
  const free = prefs.mode === "free";

  const home = free
    ? clampPosition(fromFractions(prefs.free, viewport, size), viewport, size, reserve)
    : dockPosition(viewport, size, rtl, phone ? PHONE_BAR : 16);
  const point = drag?.point ?? (guiding && flyTo ? flyTo : home);

  // Close the menu on a tap outside or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: globalThis.PointerEvent) => {
      if (!holder.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (guiding) setMenuOpen(false);
  }, [guiding]);

  const ownBo = OWN_BO_PATHS.includes(pathname);
  if ((prefs.hidden || ownBo) && !guiding) return null;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (guiding) return;
    press.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, origin: point, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = press.current;
    if (!current || current.id !== event.pointerId || !free) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    current.moved = true;
    setMenuOpen(false);
    const next = clampPosition({ x: current.origin.x + dx, y: current.origin.y + dy }, viewport, size, reserve);
    setDrag({ point: next, tilt: Math.max(-18, Math.min(18, (next.x - current.origin.x) / 6)) });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;
    press.current = null;
    if (current.moved && drag) {
      update({ free: toFractions(drag.point, viewport, size) });
      setDrag(null);
    } else {
      setMenuOpen((open) => !open);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMenuOpen((open) => !open);
      return;
    }
    if (!free) return;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -KEY_STEP, y: 0 },
      ArrowRight: { x: KEY_STEP, y: 0 },
      ArrowUp: { x: 0, y: -KEY_STEP },
      ArrowDown: { x: 0, y: KEY_STEP },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = clampPosition({ x: home.x + move.x, y: home.y + move.y }, viewport, size, reserve);
    update({ free: toFractions(next, viewport, size) });
  }

  function choose(action: () => void) {
    setMenuOpen(false);
    action();
  }

  const side = popoverSide(point, viewport, size);
  const popoverClass = `${side.below ? "top-full mt-2" : "bottom-full mb-2"} ${side.alignEnd ? "right-0" : "left-0"}`;

  return (
    <div
      ref={holder}
      className={`bo-float ${drag ? "is-dragging" : ""} ${guiding ? "is-guiding" : ""}`}
      style={{ width: size, height: size, transform: `translate3d(${Math.round(point.x)}px, ${Math.round(point.y)}px, 0)` }}
    >
      <div
        role="button"
        tabIndex={guiding ? -1 : 0}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={t("bo.label")}
        data-free={free || undefined}
        className="bo-float-body"
        style={{ transform: drag ? `rotate(${drag.tilt}deg)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          press.current = null;
          setDrag(null);
        }}
        onKeyDown={onKeyDown}
      >
        <BoRobot mood={drag ? "happy" : mood} size={size} />
      </div>

      {bubble && !menuOpen && !guiding && (
        <p role="status" className={`bo-bubble ${popoverClass}`}>
          {bubble}
        </p>
      )}

      {menuOpen && (
        <div role="menu" aria-label={t("bo.label")} className={`bo-menu ${popoverClass}`}>
          <button type="button" role="menuitem" onClick={() => choose(openChat)}>
            {t("bo.menu.chat")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              choose(() => {
                update({ mode: free ? "dock" : "free" });
                say(free ? t("bo.dockHint") : t("bo.freeHint"));
              })
            }
          >
            {free ? t("bo.menu.dock") : t("bo.menu.free")}
          </button>
          <button type="button" role="menuitem" onClick={() => choose(startGuide)}>
            {t("bo.menu.guide")}
          </button>
          <button type="button" role="menuitem" onClick={() => choose(() => setHidden(true))}>
            {t("bo.menu.hide")}
          </button>
        </div>
      )}
    </div>
  );
}
