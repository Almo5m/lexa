import { describe, expect, it } from "vitest";
import { PATH } from "@/features/curriculum";
import { basicCard } from "@/features/curriculum/basic-card";
import { GENERATE_BATCH, cardsToCsv, mergeCurated, missingEntries, parseStoredCard } from "@/features/curriculum/path-cards";

const entry = PATH[0];

describe("path cards", () => {
  it("keeps the teacher's meanings first and caps the list at three", () => {
    const aiCard = { ...basicCard(entry), meaningsAr: ["معنى تاني", entry.ar, "معنى تالت", "معنى رابع"] };
    const merged = mergeCurated(entry, aiCard);
    expect(merged.meaningsAr[0]).toBe(entry.ar.split(/[،,]/)[0].trim());
    expect(merged.meaningsAr.length).toBeLessThanOrEqual(3);
    expect(new Set(merged.meaningsAr).size).toBe(merged.meaningsAr.length);
  });

  it("forces the card's term to the path word, so a stray capital letter cannot split it", () => {
    expect(mergeCurated(entry, { ...basicCard(entry), term: entry.en.toUpperCase() }).term).toBe(entry.en);
  });

  it("asks only for the words that have no card yet, in teaching order", () => {
    const have = new Set([PATH[0].en, PATH[2].en]);
    expect(missingEntries(have, 2).map((item) => item.en)).toEqual([PATH[1].en, PATH[3].en]);
    expect(missingEntries(new Set(PATH.map((item) => item.en)), 5)).toEqual([]);
    expect(missingEntries(new Set(), 0)).toEqual([]);
    expect(GENERATE_BATCH).toBeGreaterThan(0);
  });

  it("reads a stored card only when it has the card shape", () => {
    expect(parseStoredCard(basicCard(entry))?.term).toBe(entry.en);
    expect(parseStoredCard({ term: "x" })).toBeNull();
    expect(parseStoredCard(null)).toBeNull();
  });

  it("writes a CSV with a BOM, a header, quoted cells and the review flag", () => {
    const csv = cardsToCsv([{ term: entry.en, card: { ...basicCard(entry), sentence: 'He said "hi".' }, reviewed: false }]);
    expect(csv.startsWith("﻿\"term\"")).toBe(true);
    expect(csv).toContain('"He said ""hi""."');
    expect(csv.trimEnd().endsWith('"no"')).toBe(true);
    expect(csv.split("\r\n").length).toBe(3);
  });
});
