import { describe, expect, it } from "vitest";
import { BAND_COUNT, PSEUDO_WORDS, WORD_BANK } from "@/features/levels/bank";
import {
  PSEUDO_COUNT,
  REAL_PER_BAND,
  buildPlacementTest,
  scorePlacement,
  suggestWords,
} from "@/features/levels/placement";
import { normalizeWord } from "@/features/words/clean";

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("word bank", () => {
  const all = Object.values(WORD_BANK).flat();
  it("has five bands of equal size", () => {
    expect(Object.keys(WORD_BANK)).toHaveLength(BAND_COUNT);
    for (const band of Object.values(WORD_BANK)) expect(band).toHaveLength(40);
  });
  it("has no duplicates and only clean lowercase words", () => {
    expect(new Set(all).size).toBe(all.length);
    for (const word of all) expect(normalizeWord(word)).toBe(word);
  });
  it("keeps invented words out of the real bank", () => {
    for (const fake of PSEUDO_WORDS) expect(all).not.toContain(fake);
    expect(new Set(PSEUDO_WORDS).size).toBe(PSEUDO_WORDS.length);
  });
});

describe("buildPlacementTest", () => {
  it("mixes real words from every band with invented ones", () => {
    const items = buildPlacementTest(seeded(1));
    expect(items).toHaveLength(BAND_COUNT * REAL_PER_BAND + PSEUDO_COUNT);
    expect(items.filter((item) => item.band === null)).toHaveLength(PSEUDO_COUNT);
    for (let band = 1; band <= BAND_COUNT; band++) {
      expect(items.filter((item) => item.band === band)).toHaveLength(REAL_PER_BAND);
    }
  });
});

describe("scorePlacement", () => {
  const items = buildPlacementTest(seeded(7));
  const realUpTo = (band: number) =>
    new Set(items.filter((item) => item.band !== null && item.band <= band).map((item) => item.word));

  it("knowing nothing gives level 1", () => {
    expect(scorePlacement(items, new Set()).level).toBe(1);
  });
  it("knowing the first three bands gives level 3", () => {
    const result = scorePlacement(items, realUpTo(3));
    expect(result.level).toBe(3);
    expect(result.reliable).toBe(true);
  });
  it("knowing everything honestly gives level 5", () => {
    expect(scorePlacement(items, realUpTo(5)).level).toBe(5);
  });
  it("a gap stops the level at the last band passed in a row", () => {
    const known = new Set([...realUpTo(2), ...items.filter((i) => i.band === 4).map((i) => i.word)]);
    expect(scorePlacement(items, known).level).toBe(2);
  });
  it("tapping 'I know it' on everything is flagged unreliable and does not reach level 5", () => {
    const everything = new Set(items.map((item) => item.word));
    const result = scorePlacement(items, everything);
    expect(result.reliable).toBe(false);
    expect(result.level).toBeLessThan(5);
  });
  it("a few false alarms lower the score instead of ignoring them", () => {
    const pseudo = items.filter((item) => item.band === null).slice(0, 2).map((item) => item.word);
    const clean = scorePlacement(items, realUpTo(3));
    const guessy = scorePlacement(items, new Set([...realUpTo(3), ...pseudo]));
    expect(guessy.correctedByBand[2]).toBeLessThan(clean.correctedByBand[2]);
    expect(guessy.reliable).toBe(false);
  });
  it("one false claim is tolerated and still counts against the score", () => {
    const one = items.find((item) => item.band === null)!.word;
    const result = scorePlacement(items, new Set([...realUpTo(5), one]));
    expect(result.reliable).toBe(true);
    expect(result.correctedByBand[4]).toBeCloseTo(0.8);
    expect(result.level).toBe(5);
  });
});

describe("suggestWords", () => {
  it("returns the requested number of words the student does not have", () => {
    const owned = WORD_BANK[3].slice(0, 10);
    const words = suggestWords(3, owned, 10, seeded(3));
    expect(words).toHaveLength(10);
    for (const word of words) expect(owned).not.toContain(word);
    expect(new Set(words).size).toBe(10);
  });
  it("favours the student's own band", () => {
    const words = suggestWords(3, [], 10, seeded(5));
    const fromBand3 = words.filter((word) => WORD_BANK[3].includes(word)).length;
    expect(fromBand3).toBeGreaterThanOrEqual(6);
  });
  it("still fills the list when the nearby bands are used up", () => {
    const owned = [...WORD_BANK[1], ...WORD_BANK[2], ...WORD_BANK[3]];
    expect(suggestWords(2, owned, 10, seeded(9))).toHaveLength(10);
  });
  it("returns fewer words only when the whole bank is owned", () => {
    expect(suggestWords(1, Object.values(WORD_BANK).flat(), 10)).toEqual([]);
  });
});
