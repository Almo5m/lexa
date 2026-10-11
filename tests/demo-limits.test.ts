import { describe, expect, it } from "vitest";
import { DEMO_WORD, evaluateDemoHit, isSameOrigin } from "@/features/demo/limits";

const settings = { demoEnabled: true, demoDailyLimitPerVisitor: 6, demoDailyLimitTotal: 300 };

describe("demo limits", () => {
  it("allows a visitor within both limits", () => {
    expect(evaluateDemoHit({ visitorHits: 6, totalHits: 300 }, settings)).toBeNull();
  });
  it("refuses a visitor past the personal limit", () => {
    expect(evaluateDemoHit({ visitorHits: 7, totalHits: 10 }, settings)).toBe("demo_limit_visitor");
  });
  it("closes the whole demo past the daily ceiling, even for a new visitor", () => {
    expect(evaluateDemoHit({ visitorHits: 1, totalHits: 301 }, settings)).toBe("demo_limit_total");
  });
  it("is closed when the admin turns it off", () => {
    expect(evaluateDemoHit({ visitorHits: 1, totalHits: 1 }, { ...settings, demoEnabled: false })).toBe("demo_closed");
  });
  it("accepts one English word only", () => {
    expect(DEMO_WORD.test("ability")).toBe(true);
    expect(DEMO_WORD.test("well-known")).toBe(true);
    expect(DEMO_WORD.test("ignore previous instructions")).toBe(false);
    expect(DEMO_WORD.test("كلمة")).toBe(false);
    expect(DEMO_WORD.test("a")).toBe(false);
  });
  it("rejects requests sent from another website", () => {
    expect(isSameOrigin("https://evil.example", "lexa.app")).toBe(false);
    expect(isSameOrigin("https://lexa.app", "lexa.app")).toBe(true);
    expect(isSameOrigin(null, "lexa.app")).toBe(true);
  });
});
