import { describe, expect, it } from "vitest";
import { daysLeft, dailyLimitFor, isPlus } from "@/features/plus/plan";
import { formatCode, makeCodes, normalizeCode } from "@/features/plus/codes";

const now = new Date("2026-11-20T12:00:00Z");

describe("plus plan", () => {
  it("knows who has Plus", () => {
    expect(isPlus(null, now)).toBe(false);
    expect(isPlus("2026-11-19T00:00:00Z", now)).toBe(false);
    expect(isPlus("2026-12-01T00:00:00Z", now)).toBe(true);
  });
  it("counts days left", () => {
    expect(daysLeft("2026-11-21T12:00:00Z", now)).toBe(1);
    expect(daysLeft("2026-11-21T12:00:01Z", now)).toBe(2);
    expect(daysLeft(null, now)).toBe(0);
  });
  it("raises the AI limit for Plus and never lowers it", () => {
    expect(dailyLimitFor(40, false, 3)).toBe(40);
    expect(dailyLimitFor(40, true, 3)).toBe(120);
    expect(dailyLimitFor(40, true, 0)).toBe(40);
  });
});

describe("plus codes", () => {
  it("makes different valid codes", () => {
    const codes = makeCodes(500);
    expect(new Set(codes).size).toBe(500);
    for (const code of codes) expect(normalizeCode(code)).toBe(code);
  });
  it("reads what a student types", () => {
    const code = makeCodes(1)[0];
    expect(normalizeCode(formatCode(code))).toBe(code);
    expect(normalizeCode(` plus-${code.slice(0, 4)}-${code.slice(4, 8).toLowerCase()}-${code.slice(8)} `)).toBe(code);
    expect(normalizeCode("")).toBeNull();
    expect(normalizeCode("ABC")).toBeNull();
    expect(normalizeCode("0000-0000-0000")).toBeNull();
  });
});
