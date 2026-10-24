import { describe, expect, it } from "vitest";
import { REQUIRED_STEPS, STEP_HREF, planToday, stepNumber, type TodayState } from "@/features/curriculum/today-plan";

const fresh: TodayState = { due: 0, learnLeft: 7, pathEnded: false, readDone: false, translatedToday: 0, spokeToday: 0 };

describe("today plan", () => {
  it("keeps four required steps in a fixed order and speaking as a bonus", () => {
    const plan = planToday(fresh);
    expect(plan.steps.map((step) => step.key)).toEqual(["review", "learn", "read", "translate", "speak"]);
    expect(plan.steps.filter((step) => step.extra).map((step) => step.key)).toEqual(["speak"]);
    expect(plan.total).toBe(4);
  });

  it("points at the first step that is not done", () => {
    expect(planToday(fresh).next?.key).toBe("learn");
    expect(planToday({ ...fresh, due: 9 }).next?.key).toBe("review");
    expect(planToday({ ...fresh, learnLeft: 0 }).next?.key).toBe("read");
    expect(planToday({ ...fresh, learnLeft: 0, readDone: true }).next?.key).toBe("translate");
  });

  it("finishes the day without the bonus step", () => {
    const plan = planToday({ ...fresh, learnLeft: 0, readDone: true, translatedToday: 2 });
    expect(plan.next).toBeNull();
    expect(plan.doneCount).toBe(4);
    expect(plan.steps.find((step) => step.key === "speak")?.done).toBe(false);
  });

  it("counts learning as done when the path has no words left", () => {
    expect(planToday({ ...fresh, pathEnded: true }).steps[1].done).toBe(true);
  });

  it("numbers only the required steps and has a link for each", () => {
    expect(REQUIRED_STEPS.map((key) => stepNumber(key))).toEqual([1, 2, 3, 4]);
    expect(stepNumber("speak")).toBeNull();
    for (const key of ["review", "learn", "read", "translate", "speak"] as const) expect(STEP_HREF[key].startsWith("/")).toBe(true);
  });
});
