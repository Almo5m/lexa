import { createHash, randomBytes } from "node:crypto";

export const SHARE_DAYS = 30;

/** 256 random bits: not guessable. Only the hash is stored. */
export function newShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isPlausibleToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function expiryFrom(now: Date, days = SHARE_DAYS): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

export function isActive(expiresAt: string | Date, now = new Date()): boolean {
  return new Date(expiresAt).getTime() > now.getTime();
}
