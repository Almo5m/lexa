import { randomInt } from "node:crypto";

// Same unambiguous letters and digits as the duel codes: no 0, 1, O, I or L.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12;

export function makeCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/** `n` different codes. */
export function makeCodes(n: number): string[] {
  const codes = new Set<string>();
  while (codes.size < n) codes.add(makeCode());
  return [...codes];
}

/** What the student sees and sends on a card: PLUS-ABCD-EFGH-JKMN. */
export function formatCode(code: string): string {
  return `PLUS-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

/**
 * Reads what a student typed or pasted (any case, with or without dashes and the PLUS prefix).
 * Returns the 12 characters stored in the database, or null if it cannot be a code.
 */
export function normalizeCode(input: string): string | null {
  let value = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (value.length === CODE_LENGTH + 4 && value.startsWith("PLUS")) value = value.slice(4);
  return value.length === CODE_LENGTH && [...value].every((char) => ALPHABET.includes(char)) ? value : null;
}
