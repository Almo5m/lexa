import { describe, expect, it } from "vitest";
import { PARTS, buildOverview, type OverviewInput } from "@/features/stage/overview";
import { dictionaries } from "@/lib/i18n/dictionary";

const base: OverviewInput = { wordsTotal: 100, wordsStarted: 50, grammarTopics: 0, scores: [], grammarUnits: 6, writingTasks: 3, listeningTasks: 6 };

describe("curriculum overview", () => {
  it("lists every part of the book year", () => {
    expect(buildOverview(base).parts.map((p) => p.id)).toEqual(["words", "grammar", "writing", "listening", "speaking"]);
  });
  it("year 1 and 2 have scored writing and uploaded grammar lessons, no listening yet", () => {
    const { parts } = buildOverview({ ...base, grammarUnits: 0, grammarTopics: 4, listeningTasks: 0, writingTasks: 6 });
    expect(parts.map((p) => p.id)).toEqual(["words", "grammar", "writing", "speaking"]);
    expect(parts[1]).toMatchObject({ total: 4, done: null, state: "todo" });
  });
  it("general learners only have words, topics and speaking", () => {
    const { parts } = buildOverview({ ...base, grammarUnits: 0, grammarTopics: 0, writingTasks: 0, listeningTasks: 0 });
    expect(parts.map((p) => p.id)).toEqual(["words", "grammar", "speaking"]);
    expect(parts[1].state).toBe("empty");
  });
  it("counts tried tasks once and sets states", () => {
    const { parts } = buildOverview({ ...base, scores: [{ kind: "grammar", item_id: "g1" }, { kind: "grammar", item_id: "g1" }, { kind: "writing", item_id: "w1" }, { kind: "writing", item_id: "w2" }, { kind: "writing", item_id: "w3" }] });
    expect(parts.find((p) => p.id === "grammar")).toMatchObject({ done: 1, percent: 17, state: "progress" });
    expect(parts.find((p) => p.id === "writing")).toMatchObject({ done: 3, state: "done" });
    expect(parts.find((p) => p.id === "listening")?.state).toBe("todo");
  });
  it("empty content is marked empty and ignored in the overall number", () => {
    const out = buildOverview({ ...base, wordsTotal: 0, wordsStarted: 0, grammarUnits: 0, grammarTopics: 0, writingTasks: 0, listeningTasks: 0 });
    expect(out.parts[0].state).toBe("empty");
    expect(out.overall).toBeNull();
  });
  it("next step prefers what is in progress", () => {
    expect(buildOverview(base).next?.id).toBe("words");
    expect(buildOverview({ ...base, wordsStarted: 0 }).next?.id).toBe("words");
  });
  it("every part has texts in both languages", () => {
    for (const lang of ["ar", "en"] as const) {
      const d = dictionaries[lang] as Record<string, string>;
      for (const part of PARTS) {
        expect(d[`cur.part.${part}`], `${lang} ${part}`).toBeTruthy();
        expect(d[`cur.hint.${part}`], `${lang} hint ${part}`).toBeTruthy();
      }
      for (const state of ["empty", "todo", "progress", "done"]) expect(d[`cur.state.${state}`], `${lang} ${state}`).toBeTruthy();
    }
  });
});
