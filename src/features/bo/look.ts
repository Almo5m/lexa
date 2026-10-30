export type HatId = "none" | "cap" | "phones" | "crown";
export type ColorId = "blue" | "coral" | "green" | "purple" | "gold";

export interface BoLook {
  hat: HatId;
  color: ColorId;
}

/** What each piece needs: the student's level. Add a line here to add a new piece (and its words in the dictionary). */
export const HATS: { id: HatId; minLevel: number }[] = [
  { id: "none", minLevel: 1 },
  { id: "cap", minLevel: 2 },
  { id: "phones", minLevel: 3 },
  { id: "crown", minLevel: 5 },
];

export const COLORS: { id: ColorId; hex: string; minLevel: number }[] = [
  { id: "blue", hex: "#3d5bff", minLevel: 1 },
  { id: "coral", hex: "#ff6b57", minLevel: 2 },
  { id: "green", hex: "#1fb57a", minLevel: 4 },
  { id: "purple", hex: "#8a5cf6", minLevel: 6 },
  { id: "gold", hex: "#e0a800", minLevel: 8 },
];

export const DEFAULT_LOOK: BoLook = { hat: "none", color: "blue" };
export const LOOK_KEY = "booo.bo.look";

/** Reads a saved look; anything unknown falls back to the default piece. */
export function parseLook(raw: string | null): BoLook {
  try {
    const value = JSON.parse(raw ?? "{}") as Partial<BoLook>;
    return {
      hat: HATS.some((hat) => hat.id === value.hat) ? (value.hat as HatId) : DEFAULT_LOOK.hat,
      color: COLORS.some((color) => color.id === value.color) ? (value.color as ColorId) : DEFAULT_LOOK.color,
    };
  } catch {
    return DEFAULT_LOOK;
  }
}

export function colorHex(id: ColorId): string {
  return COLORS.find((color) => color.id === id)?.hex ?? COLORS[0].hex;
}

/** A look the student has not unlocked yet drops back to the default piece. */
export function clampLook(look: BoLook, level: number): BoLook {
  const hatOk = HATS.find((hat) => hat.id === look.hat)!.minLevel <= level;
  const colorOk = COLORS.find((color) => color.id === look.color)!.minLevel <= level;
  return { hat: hatOk ? look.hat : DEFAULT_LOOK.hat, color: colorOk ? look.color : DEFAULT_LOOK.color };
}
