export interface StreakState {
  current: number;
  longest: number;
  lastActiveDate: string | null;
  freezes: number;
}

export function toDateKey(date: Date, timeZone = "Africa/Cairo"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

export function recordActivity(state: StreakState, todayKey: string): StreakState {
  if (state.lastActiveDate === todayKey) return state;

  let current = 1;
  let freezes = state.freezes;

  if (state.lastActiveDate !== null) {
    const gap = daysBetween(state.lastActiveDate, todayKey);
    if (gap < 1) return state;
    const missedDays = gap - 1;
    if (missedDays === 0) {
      current = state.current + 1;
    } else if (missedDays <= freezes) {
      freezes -= missedDays;
      current = state.current + 1;
    }
  }

  return {
    current,
    longest: Math.max(state.longest, current),
    lastActiveDate: todayKey,
    freezes,
  };
}

export function refillFreezes(freezes: number, perWeek: number): number {
  return Math.min(freezes + 1, Math.max(perWeek, freezes));
}
