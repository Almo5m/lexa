"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_BO_VARIANT, readBoVariant, subscribeBoVariant, type BoVariant } from "@/features/bo/variant";

/** The Bo the student picked on this device. Every Bo on screen changes together when the choice changes. */
export function useBoVariant(): BoVariant {
  return useSyncExternalStore(subscribeBoVariant, readBoVariant, () => DEFAULT_BO_VARIANT);
}
