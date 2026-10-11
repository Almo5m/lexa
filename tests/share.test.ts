import { describe, expect, it } from "vitest";
import { expiryFrom, hashShareToken, isActive, isPlausibleToken, newShareToken } from "@/features/share/token";
import { firstNameOf, lastSevenDays } from "@/features/share/report";

describe("share links", () => {
  it("makes long unique tokens that pass the format check", () => {
    const a = newShareToken();
    const b = newShareToken();
    expect(a).not.toBe(b);
    expect(isPlausibleToken(a)).toBe(true);
    expect(isPlausibleToken("short")).toBe(false);
    expect(isPlausibleToken("../../etc/passwd")).toBe(false);
  });
  it("stores a hash that is not the token", () => {
    const token = newShareToken();
    expect(hashShareToken(token)).not.toContain(token);
    expect(hashShareToken(token)).toBe(hashShareToken(token));
    expect(hashShareToken(token)).toHaveLength(64);
  });
  it("expires", () => {
    const now = new Date("2026-10-10T00:00:00Z");
    expect(isActive(expiryFrom(now, 30), now)).toBe(true);
    expect(isActive(expiryFrom(now, 30), new Date("2026-12-01T00:00:00Z"))).toBe(false);
  });
  it("shares only the first name", () => {
    expect(firstNameOf("Ahmed Mohamed Ali")).toBe("Ahmed");
    expect(firstNameOf("")).toBe("");
  });
  it("covers seven days ending today", () => {
    const days = lastSevenDays(new Date("2026-10-10T12:00:00Z"));
    expect(days).toHaveLength(7);
    expect(days[6]).toBe("2026-10-10");
    expect(days[0]).toBe("2026-10-04");
  });
});
