import { describe, expect, it } from "vitest";
import { lastDays, requestsPerDay, summarizeUsage, type UsageRow } from "@/features/admin/stats";

const row = (feature: UsageRow["feature"], ok: boolean, latency_ms: number, created_at: string): UsageRow => ({
  feature,
  ok,
  latency_ms,
  created_at,
});

describe("summarizeUsage", () => {
  it("returns nulls for no data instead of dividing by zero", () => {
    expect(summarizeUsage([])).toEqual({
      total: 0,
      failed: 0,
      successRate: null,
      averageLatencyMs: null,
      byFeature: { extract: 0, cards: 0, tutor: 0, translate: 0 },
    });
  });
  it("counts failures, features and average latency", () => {
    const summary = summarizeUsage([
      row("extract", true, 1000, "2026-10-06T10:00:00Z"),
      row("tutor", false, 500, "2026-10-06T11:00:00Z"),
      row("tutor", true, 1500, "2026-10-06T12:00:00Z"),
      row("cards", true, 1000, "2026-10-06T13:00:00Z"),
    ]);
    expect(summary.total).toBe(4);
    expect(summary.failed).toBe(1);
    expect(summary.successRate).toBe(0.75);
    expect(summary.averageLatencyMs).toBe(1000);
    expect(summary.byFeature).toEqual({ extract: 1, cards: 1, tutor: 2, translate: 0 });
  });
});

describe("requestsPerDay", () => {
  it("fills days without traffic with zero and ignores rows outside the window", () => {
    const days = lastDays(3, new Date("2026-10-06T08:00:00Z"));
    expect(days).toEqual(["2026-10-04", "2026-10-05", "2026-10-06"]);
    const result = requestsPerDay(
      [
        row("tutor", true, 1, "2026-10-06T01:00:00Z"),
        row("tutor", true, 1, "2026-10-06T02:00:00Z"),
        row("tutor", true, 1, "2026-09-01T02:00:00Z"),
      ],
      days,
    );
    expect(result).toEqual([
      { day: "2026-10-04", count: 0 },
      { day: "2026-10-05", count: 0 },
      { day: "2026-10-06", count: 2 },
    ]);
  });
});
