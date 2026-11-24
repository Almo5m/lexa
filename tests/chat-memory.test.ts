import { describe, expect, it } from "vitest";
import {
  CARRY_MAX_CHARS, RECENT_MESSAGES, SUMMARIZE_EVERY, SUMMARY_MAX_CHARS, buildPrompt, carryOver, chatLimitFor,
  clampSummary, conversationFull, summarizableCount, titleFrom,
} from "@/features/chat/memory";
import { defaultSettings } from "@/lib/settings";

describe("summary size cap", () => {
  it("never exceeds the cap and cuts at a word", () => {
    const long = "word ".repeat(1000);
    const out = clampSummary(long);
    expect(out.length).toBeLessThanOrEqual(SUMMARY_MAX_CHARS);
    expect(out.endsWith("word")).toBe(true);
  });
  it("keeps short text and squeezes spaces", () => expect(clampSummary("a   b\n c")).toBe("a b c"));
  it("carry-over is smaller than the full summary", () => {
    expect(carryOver("x ".repeat(2000)).length).toBeLessThanOrEqual(CARRY_MAX_CHARS);
  });
});

describe("when to summarize", () => {
  it("waits until enough older messages gather", () => {
    expect(summarizableCount(RECENT_MESSAGES + SUMMARIZE_EVERY - 1, 0)).toBe(0);
    expect(summarizableCount(RECENT_MESSAGES + SUMMARIZE_EVERY, 0)).toBe(SUMMARIZE_EVERY);
    expect(summarizableCount(16, 6)).toBe(0);
    expect(summarizableCount(22, 6)).toBe(8);
  });
  it("force folds in everything not yet summarized", () => expect(summarizableCount(20, 6, true)).toBe(14));
});

describe("limits", () => {
  it("full conversation", () => {
    expect(conversationFull(29, defaultSettings)).toBe(false);
    expect(conversationFull(30, defaultSettings)).toBe(true);
  });
  it("plus is never below free", () => {
    expect(chatLimitFor(false, { chatDailyFree: 15, chatDailyPlus: 60 })).toBe(15);
    expect(chatLimitFor(true, { chatDailyFree: 15, chatDailyPlus: 60 })).toBe(60);
    expect(chatLimitFor(true, { chatDailyFree: 15, chatDailyPlus: 5 })).toBe(15);
  });
});

describe("prompt and title", () => {
  it("prompt has facts, memory and only the recent messages", () => {
    const recent = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? ("tutor" as const) : ("student" as const), text: `m${i}` }));
    const prompt = buildPrompt({ facts: { firstName: "Moaz", stage: "sec3", levelBand: 3, interests: ["football"] }, summary: "likes football", recent });
    expect(prompt).toContain("Name: Moaz");
    expect(prompt).toContain("likes football");
    expect(prompt).toContain("m11");
    expect(prompt).not.toContain("m3\n");
    expect(prompt.endsWith("Bo:")).toBe(true);
  });
  it("title is short", () => expect(titleFrom("x".repeat(200)).length).toBeLessThanOrEqual(48));
});
