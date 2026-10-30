"use client";

import { useMemo, useSyncExternalStore } from "react";
import { LOOK_KEY, parseLook, type BoLook } from "./look";

const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(LOOK_KEY);
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/** Saves the look on this device and tells every Bo on screen. */
export function saveLook(look: BoLook) {
  try {
    localStorage.setItem(LOOK_KEY, JSON.stringify(look));
  } catch {
    /* private mode: the look lasts until the page closes only if storage works, so nothing to do */
  }
  listeners.forEach((callback) => callback());
}

export function useBoLook(): BoLook {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => parseLook(raw), [raw]);
}
