import { describe, expect, it } from "vitest";
import { countByLevel, filterWords, levelOf, type BubbleWord } from "@/features/words/bubbles";
import { dictionaries } from "@/lib/i18n/dictionary";

const w = (over: Partial<BubbleWord>): BubbleWord => ({
  id: over.term ?? "x", term: "apple", status: "learning", reviewed: true, correct: 0, wrong: 0,
  source: "own", groupId: null, createdAt: "2026-11-01", ...over,
});

describe("word levels", () => {
  it("never studied is todo", () => expect(levelOf(w({ reviewed: false, status: "mastered" }))).toBe("todo"));
  it("maps scheduler statuses", () => {
    expect(levelOf(w({ status: "mastered" }))).toBe("mastered");
    expect(levelOf(w({ status: "weak" }))).toBe("weak");
    expect(levelOf(w({ status: "learning", correct: 1 }))).toBe("learning");
    expect(levelOf(w({ status: "learning", correct: 5, wrong: 1 }))).toBe("known");
    expect(levelOf(w({ status: "learning", correct: 5, wrong: 4 }))).toBe("learning");
  });
});

describe("filters and sort", () => {
  const list = [
    w({ term: "bat", status: "weak", wrong: 3, source: "school", createdAt: "2026-11-02" }),
    w({ term: "ant", status: "mastered", source: "path", createdAt: "2026-11-03", groupId: "g1" }),
    w({ term: "cat", reviewed: false, source: "own", createdAt: "2026-11-04" }),
  ];
  it("filters by level, source, group and search", () => {
    expect(filterWords(list, { level: "weak" }).map((x) => x.term)).toEqual(["bat"]);
    expect(filterWords(list, { source: "path" }).map((x) => x.term)).toEqual(["ant"]);
    expect(filterWords(list, { groupId: "g1" }).map((x) => x.term)).toEqual(["ant"]);
    expect(filterWords(list, { query: "  CA " }).map((x) => x.term)).toEqual(["cat"]);
  });
  it("sorts", () => {
    expect(filterWords(list, {}).map((x) => x.term)).toEqual(["ant", "bat", "cat"]);
    expect(filterWords(list, { sort: "newest" }).map((x) => x.term)).toEqual(["cat", "ant", "bat"]);
    expect(filterWords(list, { sort: "weakest" }).map((x) => x.term)).toEqual(["bat", "cat", "ant"]);
  });
  it("counts per level", () => {
    expect(countByLevel(list)).toMatchObject({ weak: 1, mastered: 1, todo: 1, learning: 0 });
  });
  it("has texts for every level and source in both languages", () => {
    for (const lang of ["ar", "en"] as const) {
      const d = dictionaries[lang] as Record<string, string>;
      for (const k of ["todo", "learning", "weak", "known", "mastered"]) expect(d[`mastery.${k}`], `${lang} ${k}`).toBeTruthy();
      for (const k of ["school", "path", "own"]) expect(d[`source.${k}`], `${lang} ${k}`).toBeTruthy();
      for (const k of ["az", "newest", "weakest"]) expect(d[`sort.${k}`], `${lang} ${k}`).toBeTruthy();
    }
  });
});
