import { describe, expect, it } from "vitest";
import { PATH, UNITS, nextPathWords } from "@/features/curriculum";
import { normalizeWord } from "@/features/words/clean";
import { newWordsQuota, reviewRoundSize } from "@/features/curriculum/session-plan";

describe("curriculum content", () => {
  it("has units of 20 to 30 words", () => {
    for (const unit of UNITS) expect(unit.words.length, unit.id).toBeGreaterThanOrEqual(20);
    for (const unit of UNITS) expect(unit.words.length, unit.id).toBeLessThanOrEqual(30);
  });

  it("never repeats a word, even across units", () => {
    const seen = new Set<string>();
    for (const entry of PATH) {
      expect(seen.has(entry.en), entry.en).toBe(false);
      seen.add(entry.en);
    }
  });

  it("only has words the app accepts", () => {
    for (const entry of PATH) expect(normalizeWord(entry.en), entry.en).toBe(entry.en);
  });

  it("fills every field and the phrase shows the word", () => {
    for (const entry of PATH) {
      expect(entry.ar.trim(), entry.en).not.toBe("");
      expect(entry.chunkAr.trim(), entry.en).not.toBe("");
      const stem = entry.en.slice(0, Math.min(entry.en.length, 4));
      expect(entry.chunkEn.toLowerCase(), entry.en).toContain(stem);
      expect(entry.chunkEn.length, entry.en).toBeLessThanOrEqual(60);
    }
  });

  it("has unique unit ids", () => {
    expect(new Set(UNITS.map((unit) => unit.id)).size).toBe(UNITS.length);
  });
});

describe("path order", () => {
  it("starts with the first unit and skips what the student already has", () => {
    expect(nextPathWords(new Set(), 3).map((e) => e.en)).toEqual(["mother", "father", "brother"]);
    expect(nextPathWords(new Set(["mother", "brother"]), 2).map((e) => e.en)).toEqual(["father", "sister"]);
  });

  it("returns nothing when asked for zero", () => {
    expect(nextPathWords(new Set(), 0)).toEqual([]);
  });
});

describe("session plan", () => {
  it("scales new words with the time the student picks", () => {
    expect(newWordsQuota(10, 15)).toBe(10);
    expect(newWordsQuota(10, 30)).toBe(18);
    expect(newWordsQuota(10, 45)).toBe(25);
  });
  it("gives longer rounds to longer days", () => {
    expect(reviewRoundSize(15)).toBeLessThan(reviewRoundSize(45));
  });
});

describe("placement start", () => {
  it("starts at A1 without a reliable test, skips A1 from band 3 and A1+A2 at band 5", async () => {
    const { startUnitIndex, UNITS: all, nextPathWords: next, pathSizeFrom } = await import("@/features/curriculum");
    expect(startUnitIndex(null)).toBe(0);
    expect(startUnitIndex(2)).toBe(0);
    expect(all[startUnitIndex(3)].level).toBe("A2");
    expect(all[startUnitIndex(4)].level).toBe("A2");
    expect(all[startUnitIndex(5)].level).toBe("B1");
    expect(next(new Set(), 1, startUnitIndex(3))[0].unitId).toBe("a2-01");
    expect(pathSizeFrom(0)).toBeGreaterThan(pathSizeFrom(startUnitIndex(3)));
  });
});
