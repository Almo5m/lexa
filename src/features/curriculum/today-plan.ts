/**
 * The shape of one study day. Four steps in a fixed order, always the same, so the student never has to decide
 * what comes next. Speaking is a bonus: it never blocks the end of the session.
 */
export type StepKey = "review" | "learn" | "read" | "translate" | "speak";

export const REQUIRED_STEPS: readonly StepKey[] = ["review", "learn", "read", "translate"];

/** Where each step lives. The query makes the page show the "step n of 4" banner. */
export const STEP_HREF: Record<StepKey, string> = {
  review: "/review?from=today",
  learn: "/learn",
  read: "/read",
  translate: "/translate?today=1",
  speak: "/talk?today=1",
};

export interface TodayState {
  /** Words that are due for review. */
  due: number;
  /** New words still to learn today, counting the ones already handed out but not learned. */
  learnLeft: number;
  /** The whole path is finished, so there is nothing left to learn. */
  pathEnded: boolean;
  readDone: boolean;
  translatedToday: number;
  spokeToday: number;
}

export interface PlannedStep {
  key: StepKey;
  done: boolean;
  /** A bonus step that does not count toward finishing the day. */
  extra: boolean;
}

export interface TodayPlan {
  steps: PlannedStep[];
  /** The first required step that is not done, or null when the day is finished. */
  next: PlannedStep | null;
  doneCount: number;
  total: number;
}

export function planToday(state: TodayState): TodayPlan {
  const done: Record<StepKey, boolean> = {
    review: state.due === 0,
    learn: state.learnLeft === 0 || state.pathEnded,
    read: state.readDone,
    translate: state.translatedToday > 0,
    speak: state.spokeToday > 0,
  };
  const steps: PlannedStep[] = [
    ...REQUIRED_STEPS.map((key) => ({ key, done: done[key], extra: false })),
    { key: "speak" as const, done: done.speak, extra: true },
  ];
  const required = steps.filter((step) => !step.extra);
  return {
    steps,
    next: required.find((step) => !step.done) ?? null,
    doneCount: required.filter((step) => step.done).length,
    total: required.length,
  };
}

/** 1-based place of a required step, or null for the bonus step. */
export function stepNumber(key: StepKey): number | null {
  const index = REQUIRED_STEPS.indexOf(key);
  return index === -1 ? null : index + 1;
}
