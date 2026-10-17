import { describe, expect, it } from "vitest";
import { UNITS } from "@/features/curriculum";
import { currentUnit, unitProgress, type WordState } from "@/features/curriculum/progress";
import { readingMeter, speakMeter, translateMeter, wordsMeter } from "@/features/skills/meters";

const unit = UNITS[0];
const states = (learned: number, solid: number): Map<string, WordState> =>
  new Map(unit.words.map((word, i) => [word.en, { learned: i < learned, repetitions: i < solid ? 2 : 0 }]));

describe("unit progress", () => {
  it("is new when nothing is learned", () => {
    expect(unitProgress(unit, new Map()).state).toBe("new");
  });
  it("is learning while some words are missing", () => {
    expect(unitProgress(unit, states(10, 0))).toMatchObject({ state: "learning", learned: 10, mastered: 0 });
  });
  it("is learned when every word was met but not solid", () => {
    expect(unitProgress(unit, states(unit.words.length, 5)).state).toBe("learned");
  });
  it("is mastered when 80 percent are solid", () => {
    const total = unit.words.length;
    expect(unitProgress(unit, states(total, Math.ceil(total * 0.8))).state).toBe("mastered");
    expect(unitProgress(unit, states(total, Math.ceil(total * 0.8) - 1)).state).toBe("learned");
  });
  it("picks the first unit that is not fully learned as the current one", () => {
    const all = UNITS.map((u, i) => unitProgress(u, i === 0 ? states(unit.words.length, 0) : new Map()));
    expect(currentUnit(all)?.unitId).toBe(UNITS[1].id);
    expect(currentUnit(all.map((item) => ({ ...item, state: "mastered" as const })))).toBeNull();
  });
});

describe("skill meters", () => {
  it("says nothing without data", () => {
    expect(wordsMeter(0, 300).percent).toBeNull();
    expect(translateMeter(["good", "good"]).percent).toBeNull();
    expect(readingMeter([]).percent).toBeNull();
    expect(speakMeter([]).percent).toBeNull();
  });
  it("counts good and easy translations among the latest 20", () => {
    expect(translateMeter(["good", "easy", "again", "hard"]).percent).toBe(50);
  });
  it("averages finished reading texts only", () => {
    const meter = readingMeter([
      { answers: [{ correct: true }, { correct: true }, { correct: false }], questions: 3 },
      { answers: [{ correct: true }], questions: 3 },
    ]);
    expect(meter.percent).toBe(67);
  });
  it("shows the speaking level as a band", () => {
    const meter = speakMeter([{ vocabulary_level: 2, grammar_level: 2, clarity_level: 2, mistakes: [], created_at: "2026-10-01" }]);
    expect(meter.value).toBe("A2");
    expect(meter.percent).toBe(40);
  });
  it("caps the words meter at 100", () => {
    expect(wordsMeter(400, 300).percent).toBe(100);
  });
});
