export interface UsageRow {
  feature: "extract" | "cards" | "tutor";
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
  const byFeature = { extract: 0, cards: 0, tutor: 0 };
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
