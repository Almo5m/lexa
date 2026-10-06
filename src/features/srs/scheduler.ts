import type { AppSettings } from "@/lib/settings";
import type { Grade, SrsState, WordStatus } from "./types";

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;

export function createInitialState(settings: AppSettings, now: Date): SrsState {
  return {
    ease: settings.srsStartingEase,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    correctCount: 0,
    wrongCount: 0,
    dueAt: now.toISOString(),
    lastReviewedAt: null,
  };
}

export function scheduleReview(
  state: SrsState,
  grade: Grade,
  settings: AppSettings,
  now: Date,
): SrsState {
  const next: SrsState = { ...state, lastReviewedAt: now.toISOString() };

  if (grade === "again") {
    next.lapses += 1;
    next.wrongCount += 1;
    next.repetitions = 0;
    next.ease = Math.max(MIN_EASE, state.ease - 0.2);
    next.intervalDays = 10 / (24 * 60);
  } else {
    next.correctCount += 1;
    next.repetitions += 1;
    if (grade === "hard") next.ease = Math.max(MIN_EASE, state.ease - 0.15);
    if (grade === "easy") next.ease = state.ease + 0.15;
    next.intervalDays = nextInterval(state, next, grade, settings);
  }

  next.dueAt = new Date(now.getTime() + next.intervalDays * DAY_MS).toISOString();
  return next;
}

function nextInterval(
  previous: SrsState,
  next: SrsState,
  grade: Exclude<Grade, "again">,
  settings: AppSettings,
): number {
  if (next.repetitions === 1) {
    const first = settings.srsFirstIntervalDays;
    return grade === "easy" ? first * 2.5 : grade === "hard" ? first * 0.5 : first;
  }
  const base = Math.max(previous.intervalDays, settings.srsFirstIntervalDays);
  const factor = grade === "hard" ? 1.2 : grade === "easy" ? next.ease * 1.3 : next.ease;
  return base * factor;
}

export function classifyWord(state: SrsState, settings: AppSettings): WordStatus {
  if (state.lastReviewedAt === null) return "new";
  const struggling =
    state.lapses >= settings.srsWeakLapses ||
    (state.wrongCount >= 2 && state.wrongCount > state.correctCount);
  if (struggling && state.intervalDays < settings.srsMasteredIntervalDays) return "weak";
  if (state.intervalDays >= settings.srsMasteredIntervalDays) return "mastered";
  return "learning";
}

export function isDue(state: SrsState, now: Date): boolean {
  return new Date(state.dueAt).getTime() <= now.getTime();
}

export interface ReviewCandidate {
  id: string;
  state: SrsState;
}

export function buildReviewQueue(
  candidates: ReviewCandidate[],
  settings: AppSettings,
  now: Date,
  limit: number,
): string[] {
  const due = candidates
    .filter((item) => item.state.lastReviewedAt !== null && isDue(item.state, now))
    .map((item) => ({
      id: item.id,
      weak: classifyWord(item.state, settings) === "weak",
      overdueDays: (now.getTime() - new Date(item.state.dueAt).getTime()) / DAY_MS,
    }))
    .sort((a, b) => Number(b.weak) - Number(a.weak) || b.overdueDays - a.overdueDays);

  const refreshers = candidates
    .filter((item) => classifyWord(item.state, settings) === "mastered" && !isDue(item.state, now))
    .sort((a, b) => a.state.dueAt.localeCompare(b.state.dueAt))
    .slice(0, Math.max(1, Math.floor(limit / 10)))
    .map((item) => item.id);

  const queue = due.map((item) => item.id);
  for (const id of refreshers) if (queue.length < limit && !queue.includes(id)) queue.push(id);
  return queue.slice(0, limit);
}
