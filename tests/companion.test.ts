import { describe, expect, it } from "vitest";
import { clampPosition, dockPosition, fromFractions, nextToTarget, popoverSide, toFractions, EDGE } from "@/features/bo/placement";
import { DEFAULT_PREFS, guideKey, parsePrefs } from "@/features/bo/companion-state";

const phone = { width: 360, height: 740 };

describe("placement", () => {
  it("keeps Bo fully on screen and out of reserved bars", () => {
    const low = clampPosition({ x: 9999, y: 9999 }, phone, 80, { top: 0, bottom: 72 });
    expect(low.x).toBe(360 - 80 - EDGE);
    expect(low.y).toBe(740 - 80 - EDGE - 72);
    expect(clampPosition({ x: -50, y: -50 }, phone, 80)).toEqual({ x: EDGE, y: EDGE });
  });

  it("round-trips a free position through fractions, also after the screen changes size", () => {
    const point = { x: 120, y: 300 };
    const back = fromFractions(toFractions(point, phone, 80), phone, 80);
    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
    const tablet = fromFractions(toFractions(point, phone, 80), { width: 820, height: 1100 }, 80);
    expect(tablet.x).toBeGreaterThanOrEqual(EDGE);
    expect(tablet.x).toBeLessThanOrEqual(820 - 80 - EDGE);
  });

  it("survives a screen smaller than Bo", () => {
    const tiny = { width: 60, height: 60 };
    expect(Number.isFinite(toFractions({ x: 5, y: 5 }, tiny, 80).fx)).toBe(true);
    expect(Number.isFinite(fromFractions({ fx: 0.5, fy: 0.5 }, tiny, 80).x)).toBe(true);
  });

  it("docks at the reading end, above the tab bar", () => {
    const rtl = dockPosition(phone, 76, true, 72);
    const ltr = dockPosition(phone, 76, false, 72);
    expect(rtl.x).toBeLessThan(ltr.x);
    expect(rtl.y).toBeLessThanOrEqual(740 - 72 - 76);
  });

  it("stands above a target, or below it when the target is at the top", () => {
    const low = nextToTarget({ left: 100, top: 680, width: 60, height: 50 }, phone, 80);
    expect(low.y).toBeLessThan(680);
    const high = nextToTarget({ left: 100, top: 20, width: 120, height: 40 }, phone, 80);
    expect(high.y).toBeGreaterThanOrEqual(60);
  });

  it("opens the menu away from the screen edges", () => {
    expect(popoverSide({ x: 10, y: 20 }, phone, 80)).toEqual({ below: true, alignEnd: false });
    expect(popoverSide({ x: 280, y: 600 }, phone, 80)).toEqual({ below: false, alignEnd: true });
  });
});

describe("stored preferences", () => {
  it("falls back to the defaults for nothing or junk", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("{not json")).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('{"mode":"fly","free":{"fx":"x"},"hidden":"yes"}')).toEqual(DEFAULT_PREFS);
  });

  it("reads a good value and clamps out-of-range fractions", () => {
    const prefs = parsePrefs('{"mode":"free","free":{"fx":3,"fy":-1},"hidden":true}');
    expect(prefs).toEqual({ mode: "free", free: { fx: 1, fy: 0 }, hidden: true });
  });

  it("gives every account its own guide key", () => {
    expect(guideKey("a")).not.toBe(guideKey("b"));
  });
});
