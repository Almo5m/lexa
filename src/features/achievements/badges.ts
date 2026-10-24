import { levelFromXp } from "@/features/gamification/xp";

/** Every badge comes from real study, so there is nothing to farm and no game that eats the time. */
export type Metric = "words" | "streak" | "level" | "read" | "translate" | "talk" | "grammar" | "writing" | "listening";

export interface BadgeStats {
  words: number;
  streak: number;
  xp: number;
  read: number;
  translate: number;
  talk: number;
  /** Grammar units finished with at least 80%. */
  grammar: number;
  /** Writing tasks marked at least 15 out of 20. */
  writing: number;
  /** Listening texts with every answer right. */
  listening: number;
}

export const METRIC_TARGETS: Record<Metric, number[]> = {
  words: [10, 50, 100, 250, 500, 1000, 2000],
  streak: [3, 7, 14, 30, 60],
  level: [3, 5, 10],
  read: [1, 7, 30],
  translate: [10, 50, 150],
  talk: [1, 10],
  grammar: [1, 3, 6],
  writing: [1, 3],
  listening: [1, 5],
};

export const METRICS = Object.keys(METRIC_TARGETS) as Metric[];

export function metricValue(metric: Metric, stats: BadgeStats): number {
  return metric === "level" ? levelFromXp(stats.xp) : stats[metric];
}

export interface MetricProgress {
  metric: Metric;
  value: number;
  earned: number[];
  /** The next target not yet reached, or null when every badge of this kind is earned. */
  next: number | null;
}

export function progressOf(metric: Metric, stats: BadgeStats): MetricProgress {
  const value = metricValue(metric, stats);
  const targets = METRIC_TARGETS[metric];
  return { metric, value, earned: targets.filter((target) => value >= target), next: targets.find((target) => value < target) ?? null };
}

export function earnedCount(stats: BadgeStats): { earned: number; total: number } {
  const all = METRICS.map((metric) => progressOf(metric, stats));
  return { earned: all.reduce((sum, item) => sum + item.earned.length, 0), total: METRICS.reduce((sum, metric) => sum + METRIC_TARGETS[metric].length, 0) };
}

/**
 * The badge closest to being earned, shown on Today as one motivating line.
 * Only counts metrics that grow with daily study, and ignores badges that are still far away.
 */
export function nearestBadge(stats: BadgeStats): { metric: Metric; target: number; left: number } | null {
  const candidates: Metric[] = ["words", "streak", "read", "translate"];
  let best: { metric: Metric; target: number; left: number; ratio: number } | null = null;
  for (const metric of candidates) {
    const { value, next } = progressOf(metric, stats);
    if (next === null) continue;
    const ratio = value / next;
    if (!best || ratio > best.ratio) best = { metric, target: next, left: next - value, ratio };
  }
  return best && best.ratio >= 0.5 ? { metric: best.metric, target: best.target, left: best.left } : null;
}
