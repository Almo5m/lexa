"use client";

import { useEffect, useRef, useState } from "react";
import type { BoMood, BoScene } from "@/features/bo/scene";

interface BoRobotProps {
  mood?: BoMood;
  size?: number;
  className?: string;
}

/**
 * Bo, the 3D robot. The 3D code is loaded only when the robot appears on screen, so pages that do not show him stay light.
 * It pauses when it is off screen or the tab is hidden, stays still for people who asked for less motion,
 * and falls back to a simple flat face when WebGL is not available.
 */
export function BoRobot({ mood = "neutral", size = 120, className = "" }: BoRobotProps) {
  const holder = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<BoScene | null>(null);
  const moodRef = useRef<BoMood>(mood);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    moodRef.current = mood;
    scene.current?.setMood(mood);
  }, [mood]);

  useEffect(() => {
    const element = canvas.current;
    const wrapper = holder.current;
    if (!element || !wrapper) return;
    let cancelled = false;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      if (!scene.current) return;
      if (visible && !document.hidden) scene.current.start();
      else scene.current.stop();
    };

    import("@/features/bo/scene")
      .then(async ({ createBoScene }) => {
        const created = await createBoScene(element, { reducedMotion: reduced });
        if (cancelled) {
          created.dispose();
          return;
        }
        scene.current = created;
        created.resize(size, size);
        created.setMood(moodRef.current);
        update();
      })
      .catch(() => setFailed(true));

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(wrapper);
    document.addEventListener("visibilitychange", update);

    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [size]);

  return (
    <span ref={holder} className={`mascot ${className}`} data-mood={mood} style={{ width: size, height: size }} aria-hidden="true">
      {failed ? (
        <span className="bo-fallback" data-mood={mood}>
          <span />
          <span />
        </span>
      ) : (
        <canvas ref={canvas} width={size} height={size} style={{ width: size, height: size }} />
      )}
    </span>
  );
}
