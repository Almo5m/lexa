import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings";
import {
  buildReviewQueue,
  classifyWord,
  createInitialState,
  isDue,
  scheduleReview,
} from "@/features/srs/scheduler";

const now = new Date("2026-10-06T10:00:00Z");
const settings = defaultSettings;

describe("scheduleReview", () => {
  it("a good first answer schedules the first interval", () => {
    const state = scheduleReview(createInitialState(settings, now), "good", settings, now);
    expect(state.intervalDays).toBe(settings.srsFirstIntervalDays);
    expect(state.repetitions).toBe(1);
    expect(state.correctCount).toBe(1);
  });

  it("intervals grow with consecutive good answers", () => {
    let state = createInitialState(settings, now);
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      state = scheduleReview(state, "good", settings, now);
      intervals.push(state.intervalDays);
    }
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
  });

  it("again resets progress, counts a lapse and brings the word back within minutes", () => {
    let state = createInitialState(settings, now);
    state = scheduleReview(state, "good", settings, now);
    state = scheduleReview(state, "good", settings, now);
    const before = state.ease;
    state = scheduleReview(state, "again", settings, now);
    expect(state.repetitions).toBe(0);
    expect(state.lapses).toBe(1);
    expect(state.wrongCount).toBe(1);
    expect(state.ease).toBeLessThan(before);
    expect(state.intervalDays).toBeLessThan(0.05);
  });

  it("ease never drops below the floor", () => {
    let state = createInitialState(settings, now);
    for (let i = 0; i < 30; i++) state = scheduleReview(state, "again", settings, now);
    expect(state.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("easy grows faster than hard", () => {
    const start = scheduleReview(createInitialState(settings, now), "good", settings, now);
    const easy = scheduleReview(start, "easy", settings, now);
    const hard = scheduleReview(start, "hard", settings, now);
    expect(easy.intervalDays).toBeGreaterThan(hard.intervalDays);
  });

  it("does not mutate the previous state", () => {
    const start = createInitialState(settings, now);
    const copy = { ...start };
    scheduleReview(start, "good", settings, now);
    expect(start).toEqual(copy);
  });
});

describe("classifyWord", () => {
  it("new words have never been reviewed", () => {
    expect(classifyWord(createInitialState(settings, now), settings)).toBe("new");
  });

  it("repeated mistakes make a word weak", () => {
    let state = createInitialState(settings, now);
    for (let i = 0; i < settings.srsWeakLapses; i++) state = scheduleReview(state, "again", settings, now);
    expect(classifyWord(state, settings)).toBe("weak");
  });

  it("long intervals make a word mastered", () => {
    let state = createInitialState(settings, now);
    for (let i = 0; i < 12; i++) state = scheduleReview(state, "easy", settings, now);
    expect(classifyWord(state, settings)).toBe("mastered");
  });

  it("a word with a few good answers is learning", () => {
    const state = scheduleReview(createInitialState(settings, now), "good", settings, now);
    expect(classifyWord(state, settings)).toBe("learning");
  });
});

describe("buildReviewQueue", () => {
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  function reviewed(grades: Parameters<typeof scheduleReview>[1][], at: Date) {
    let state = createInitialState(settings, at);
    for (const grade of grades) state = scheduleReview(state, grade, settings, at);
    return state;
  }

  it("skips new words and words that are not due", () => {
    const queue = buildReviewQueue(
      [
        { id: "new", state: createInitialState(settings, now) },
        { id: "later", state: reviewed(["good"], now) },
      ],
      settings,
      now,
      10,
    );
    expect(queue).toEqual([]);
  });

  it("puts weak words first, then the most overdue", () => {
    const weak = reviewed(["again", "again", "again"], dayAgo);
    const overdue = reviewed(["good"], weekAgo);
    const lessOverdue = reviewed(["good"], new Date(now.getTime() - 3 * 86_400_000));
    const queue = buildReviewQueue(
      [
        { id: "lessOverdue", state: lessOverdue },
        { id: "overdue", state: overdue },
        { id: "weak", state: weak },
      ],
      settings,
      now,
      10,
    );
    expect(queue).toEqual(["weak", "overdue", "lessOverdue"]);
  });

  it("respects the limit", () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ id: `w${i}`, state: reviewed(["good"], weekAgo) }));
    expect(buildReviewQueue(items, settings, now, 5)).toHaveLength(5);
  });

  it("brings mastered words back occasionally", () => {
    let mastered = createInitialState(settings, dayAgo);
    for (let i = 0; i < 12; i++) mastered = scheduleReview(mastered, "easy", settings, dayAgo);
    expect(isDue(mastered, now)).toBe(false);
    const queue = buildReviewQueue([{ id: "mastered", state: mastered }], settings, now, 10);
    expect(queue).toEqual(["mastered"]);
  });
});
