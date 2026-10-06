import { describe, expect, it } from "vitest";
import {
  cleanExtractedWords,
  normalizeWord,
  splitAgainstLibrary,
  splitManualInput,
} from "@/features/words/clean";

describe("normalizeWord", () => {
  it("lowercases and trims punctuation", () => {
    expect(normalizeWord("  Borrow, ")).toBe("borrow");
    expect(normalizeWord("(lend)")).toBe("lend");
  });
  it("keeps hyphens and apostrophes inside words", () => {
    expect(normalizeWord("well-known")).toBe("well-known");
    expect(normalizeWord("don’t")).toBe("don't");
  });
  it("rejects digits, single letters, Arabic and empty input", () => {
    expect(normalizeWord("12")).toBeNull();
    expect(normalizeWord("a")).toBeNull();
    expect(normalizeWord("كلمة")).toBeNull();
    expect(normalizeWord("   ")).toBeNull();
    expect(normalizeWord("abc123")).toBeNull();
  });
  it("rejects absurdly long strings", () => {
    expect(normalizeWord("a".repeat(60))).toBeNull();
  });
});

describe("cleanExtractedWords", () => {
  it("removes duplicates case-insensitively and reports them", () => {
    const result = cleanExtractedWords(["Borrow", "borrow", "lend", "LEND", "give"]);
    expect(result.words).toEqual(["borrow", "lend", "give"]);
    expect(result.duplicates.sort()).toEqual(["borrow", "lend"]);
  });
  it("skips Arabic lines silently and reports garbage as rejected", () => {
    const result = cleanExtractedWords(["يستعير", "borrow", "@@@", "9"]);
    expect(result.words).toEqual(["borrow"]);
    expect(result.rejected).toEqual(["@@@", "9"]);
  });
  it("handles empty input", () => {
    expect(cleanExtractedWords([])).toEqual({ words: [], duplicates: [], rejected: [] });
  });
  it("caps the batch size", () => {
    const many = Array.from({ length: 400 }, (_, i) => `word${String.fromCharCode(97 + (i % 26))}${"x".repeat(Math.floor(i / 26) + 1)}`);
    expect(cleanExtractedWords(many).words.length).toBeLessThanOrEqual(300);
  });
});

describe("splitManualInput", () => {
  it("splits on commas, Arabic commas, semicolons and newlines", () => {
    expect(splitManualInput("a1, borrow،lend;give\nsend")).toEqual(["a1", "borrow", "lend", "give", "send"]);
  });
});

describe("splitAgainstLibrary", () => {
  it("separates words the student already has", () => {
    const result = splitAgainstLibrary(["borrow", "lend"], ["lend"]);
    expect(result).toEqual({ fresh: ["borrow"], alreadyKnown: ["lend"] });
  });
});
