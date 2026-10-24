/**
 * The names of the product. Change them here and every screen, message and AI prompt follows.
 * `app` is the name of the site, `ai` is the name of the robot companion.
 */
export const BRAND = {
  app: { ar: "طالب علم", en: "Talib Ilm" },
  ai: { ar: "بو", en: "Bo" },
} as const;

export type BrandLang = "ar" | "en";

/** Names to fill into text: {app} and {ai}. */
export function brandVars(lang: BrandLang): { app: string; ai: string } {
  return { app: BRAND.app[lang], ai: BRAND.ai[lang] };
}
