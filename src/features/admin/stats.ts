export interface UsageRow {
  feature: "extract" | "cards" | "tutor" | "translate";
  ok: boolean;
  latency_ms: number;
  created_at: string;
}

export interface UsageSummary {
  total: number;
  failed: number;
  successRate: number | null;
  averageLatencyMs: number | null;
  byFeature: Record<UsageRow["feature"], number>;
}

export function summarizeUsage(rows: UsageRow[]): UsageSummary {
  const byFeature = { extract: 0, cards: 0, tutor: 0, translate: 0 };
  let failed = 0;
  let latencySum = 0;
  for (const row of rows) {
    byFeature[row.feature] += 1;
    if (!row.ok) failed += 1;
    latencySum += row.latency_ms;
  }
  const total = rows.length;
  return {
    total,
    failed,
    successRate: total === 0 ? null : (total - failed) / total,
    averageLatencyMs: total === 0 ? null : Math.round(latencySum / total),
    byFeature,
  };
}

export function requestsPerDay(rows: UsageRow[], dayKeys: string[]): { day: string; count: number }[] {
  const counts = new Map(dayKeys.map((key) => [key, 0]));
  for (const row of rows) {
    const key = row.created_at.slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return dayKeys.map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

export function lastDays(count: number, now: Date): string[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getTime() - (count - 1 - i) * 86_400_000);
    return date.toISOString().slice(0, 10);
  });
}

export interface FeatureSummary {
  feature: UsageRow["feature"];
  total: number;
  failed: number;
  averageLatencyMs: number | null;
}

export function summarizeByFeature(rows: UsageRow[]): FeatureSummary[] {
  const features: UsageRow["feature"][] = ["extract", "cards", "tutor", "translate"];
  return features.map((feature) => {
    const own = rows.filter((row) => row.feature === feature);
    const total = own.length;
    return {
      feature,
      total,
      failed: own.filter((row) => !row.ok).length,
      averageLatencyMs: total === 0 ? null : Math.round(own.reduce((sum, row) => sum + row.latency_ms, 0) / total),
    };
  });
}

export function okAndFailedPerDay(
  rows: UsageRow[],
  dayKeys: string[],
): { day: string; ok: number; failed: number }[] {
  const days = new Map(dayKeys.map((key) => [key, { ok: 0, failed: 0 }]));
  for (const row of rows) {
    const bucket = days.get(row.created_at.slice(0, 10));
    if (!bucket) continue;
    if (row.ok) bucket.ok += 1;
    else bucket.failed += 1;
  }
  return dayKeys.map((day) => ({ day, ...days.get(day)! }));
}

/** Failed rows store "[kind] message". Split it so the dashboard can color the kind. */
export function parseStoredError(stored: string | null): { kind: string; message: string } {
  const match = /^\[(\w+)\]\s*(.*)$/s.exec(stored ?? "");
  if (match) return { kind: match[1], message: match[2] };
  return { kind: "other", message: stored ?? "" };
}
