"use client";

import { createContext, useContext } from "react";
import type { BoMood } from "@/features/bo/scene";
import type { Point } from "@/features/bo/placement";

export interface CompanionApi {
  mood: BoMood;
  /** Shows a mood now and goes back to calm after `ms` (no `ms` keeps it until the next call). */
  setMood: (mood: BoMood, ms?: number) => void;
  /** A short line in a speech bubble next to Bo. */
  say: (text: string, ms?: number) => void;
  chatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  startGuide: () => void;
  guiding: boolean;
  /** While the guide runs, Bo flies to this spot. `null` sends him home. */
  flyTo: Point | null;
  setFlyTo: (point: Point | null) => void;
  setGuiding: (value: boolean) => void;
  guideRequest: number;
  size: number;
  hidden: boolean;
  setHidden: (value: boolean) => void;
}

export const CompanionContext = createContext<CompanionApi | null>(null);

export function useBoCompanion(): CompanionApi {
  const context = useContext(CompanionContext);
  if (!context) throw new Error("useBoCompanion needs BoCompanionProvider");
  return context;
}

