import { describe, expect, it } from "vitest";
import { bubbleFor, type BubbleState } from "@/features/bo/bubble";
import { dictionaries } from "@/lib/i18n/dictionary";

const base: BubbleState = { levelBand: 3, streak: 0, doneCount: 0, total: 4, due: 0, learned: 50 };

describe("Bo bubble", () => {
  it("asks for the level test first", () => {
    expect(bubbleFor({ ...base, levelBand: null }).key).toBe("bubble.noLevel");
  });
  it("celebrates a finished day, more when there is a streak", () => {
    expect(bubbleFor({ ...base, doneCount: 4 }).key).toBe("bubble.allDone");
    expect(bubbleFor({ ...base, doneCount: 4, streak: 5 }).key).toBe("bubble.allDoneStreak");
  });
  it("warns when a streak is about to break", () => {
    expect(bubbleFor({ ...base, streak: 6 }).key).toBe("bubble.streakRisk");
  });
  it("pushes the review when many words wait", () => {
    expect(bubbleFor({ ...base, due: 20 }).key).toBe("bubble.dueMany");
  });
  it("follows the progress of the day", () => {
    expect(bubbleFor({ ...base, doneCount: 3 }).key).toBe("bubble.almost");
    expect(bubbleFor({ ...base, doneCount: 1 }).key).toBe("bubble.midway");
  });
  it("starts by level, and gently on the first day", () => {
    expect(bubbleFor({ ...base, learned: 0 }).key).toBe("bubble.firstDay");
    expect(bubbleFor({ ...base, levelBand: 1 }).key).toBe("bubble.start1");
    expect(bubbleFor({ ...base, levelBand: 5 }).key).toBe("bubble.start5");
  });
  it("every possible key has a text in both languages", () => {
    const keys = ["noLevel", "firstDay", "allDoneStreak", "allDone", "streakRisk", "dueMany", "almost", "midway", "start1", "start2", "start3", "start4", "start5"];
    for (const lang of ["ar", "en"] as const) for (const key of keys) expect((dictionaries[lang] as Record<string, string>)[`bubble.${key}`], `${lang} ${key}`).toBeTruthy();
  });
});
