/**
 * Which Bo the student sees. It is a taste choice, so it lives in the browser (per device) and needs no database.
 * This file must stay free of three.js: it is read on pages that never draw Bo.
 */
export type BoVariant = "classic" | "flyer";

export const BO_VARIANTS: readonly BoVariant[] = ["flyer", "classic"];
export const DEFAULT_BO_VARIANT: BoVariant = "flyer";

const STORAGE_KEY = "bo-variant-v1";
const CHANGE_EVENT = "bo-variant-change";

export function isBoVariant(value: unknown): value is BoVariant {
  return value === "classic" || value === "flyer";
}

export function readBoVariant(): BoVariant {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isBoVariant(stored) ? stored : DEFAULT_BO_VARIANT;
  } catch {
    return DEFAULT_BO_VARIANT;
  }
}

export function saveBoVariant(variant: BoVariant): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    // Storage can be blocked; the choice then lasts until the page closes.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: variant }));
}

export function subscribeBoVariant(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
