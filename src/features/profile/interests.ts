export const INTERESTS = [
  "football",
  "gaming",
  "music",
  "movies",
  "social",
  "cooking",
  "cars",
  "travel",
  "drawing",
  "tech",
  "fashion",
  "fitness",
] as const;

export type Interest = (typeof INTERESTS)[number];
export const MAX_INTERESTS = 6;

/** Keeps only known interests, without repeats, up to the limit. */
export function cleanInterests(values: unknown): Interest[] {
  if (!Array.isArray(values)) return [];
  const known = new Set<string>(INTERESTS);
  const seen = new Set<string>();
  const out: Interest[] = [];
  for (const value of values) {
    if (typeof value === "string" && known.has(value) && !seen.has(value)) {
      seen.add(value);
      out.push(value as Interest);
    }
  }
  return out.slice(0, MAX_INTERESTS);
}

/** One line for the card prompt. The ids are a fixed list, so nothing a student typed ever reaches the prompt. */
export function interestsPromptLine(interests: readonly string[]): string {
  const clean = cleanInterests(interests);
  if (clean.length === 0) return "";
  return `The student likes: ${clean.join(", ")}. When it fits naturally, set some sentences in these worlds, but vary the situations and never force it.`;
}
