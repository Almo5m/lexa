import { describe, expect, it } from "vitest";
import { parseWordLines } from "@/features/school/parse";
import { nextSchoolWords } from "@/features/school/pick";
import { schoolCard } from "@/features/school/card";
import type { SchoolUnit } from "@/features/school/types";

describe("parseWordLines", () => {
  it("reads pipe, tab and csv lines", () => {
    const { words, problems } = parseWordLines("care | noun | رعاية | Take care. | خد بالك.\nmachine\tnoun\tماكينة\n\"power\",noun,\"قوة، طاقة\"");
    expect(problems).toEqual([]);
    expect(words.map((w) => w.term)).toEqual(["care", "machine", "power"]);
    expect(words[0].exampleAr).toBe("خد بالك.");
    expect(words[2].meaningAr).toBe("قوة، طاقة");
  });

  it("accepts two columns and skips a header", () => {
    const { words } = parseWordLines("word | meaning\nnature | الطبيعة");
    expect(words).toEqual([{ term: "nature", pos: "", meaningAr: "الطبيعة", exampleEn: "", exampleAr: "" }]);
  });

  it("reports bad lines and duplicates without stopping", () => {
    const { words, problems } = parseWordLines("care | n | رعاية\nbad1 | n | x\nlonely\nsea | n |\nCare | n | رعاية");
    expect(words).toHaveLength(1);
    expect(problems.map((p) => [p.line, p.reason])).toEqual([[2, "term"], [3, "format"], [4, "meaning"], [5, "duplicate"]]);
  });
});

describe("nextSchoolWords", () => {
  const word = (unitId: string, term: string) => ({ id: term, unitId, term, pos: "", meaningAr: "م", exampleEn: "", exampleAr: "" });
  const units: SchoolUnit[] = [
    { id: "u1", titleAr: "1", titleEn: "", words: [word("u1", "care"), word("u1", "heart")] },
    { id: "u2", titleAr: "2", titleEn: "", words: [word("u2", "machine"), word("u2", "care")] },
  ];

  it("goes unit by unit and skips owned and repeated words", () => {
    expect(nextSchoolWords(units, new Set(["care"]), 5).map((w) => w.term)).toEqual(["heart", "machine"]);
  });

  it("can be limited to one unit", () => {
    expect(nextSchoolWords(units, new Set(), 5, "u2").map((w) => w.term)).toEqual(["machine", "care"]);
  });
});

describe("schoolCard", () => {
  it("splits the meanings", () => {
    const card = schoolCard({ term: "power", pos: "noun", meaningAr: "قوة، طاقة", exampleEn: "Power.", exampleAr: "قوة." });
    expect(card.meaningsAr).toEqual(["قوة", "طاقة"]);
  });
});

import { isMissingTable } from "@/features/school/load";

describe("isMissingTable", () => {
  it("recognises a database without the school tables", () => {
    expect(isMissingTable({ code: "PGRST205", message: "Could not find the table 'public.school_units'" })).toBe(true);
    expect(isMissingTable({ code: "42P01" })).toBe(true);
    expect(isMissingTable({ code: "42501", message: "permission denied" })).toBe(false);
    expect(isMissingTable(null)).toBe(false);
  });
});
