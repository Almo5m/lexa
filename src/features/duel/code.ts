import { randomInt } from "node:crypto";

// No 0, 1, O, I or L: a code read aloud or typed from a screenshot should not be ambiguous.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_PATTERN = /^[A-Z2-9]{6}$/;

export function makeDuelCode(): string {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export function isDuelCode(value: string): boolean {
  return CODE_PATTERN.test(value) && [...value].every((char) => ALPHABET.includes(char));
}
