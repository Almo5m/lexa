import { describe, expect, it } from "vitest";
import { activeCounts, lastActiveByUser, safeLike, signupsPerDay } from "@/features/admin/growth";
import { summarize } from "@/features/admin/readiness";

describe("growth numbers", () => {
  it("counts signups per day and ignores days outside the range", () => {
    const result = signupsPerDay(["2026-11-10T08:00:00Z", "2026-11-10T09:00:00Z", "2026-11-11T01:00:00Z", "2026-10-01T01:00:00Z"], ["2026-11-10", "2026-11-11", "2026-11-12"]);
    expect(result.map((r) => r.count)).toEqual([2, 1, 0]);
  });
  it("counts different students, not rows", () => {
    const rows = [
      { user_id: "a", day: "2026-11-16" }, { user_id: "a", day: "2026-11-15" }, { user_id: "b", day: "2026-11-12" }, { user_id: "c", day: "2026-10-20" },
    ];
    expect(activeCounts(rows, "2026-11-16", "2026-11-10", "2026-10-18")).toEqual({ today: 1, week: 2, month: 3 });
  });
  it("finds the last day of each student", () => {
    const last = lastActiveByUser([{ user_id: "a", day: "2026-11-01" }, { user_id: "a", day: "2026-11-05" }, { user_id: "b", day: "2026-11-02" }]);
    expect(last.get("a")).toBe("2026-11-05");
    expect(last.get("b")).toBe("2026-11-02");
  });
  it("cleans search text", () => {
    expect(safeLike("50%_x,(y)")).toBe("50  x  y");
    expect(safeLike("a".repeat(100))).toHaveLength(40);
  });
  it("is ready only when every must passes", () => {
    expect(summarize([{ id: "a", level: "must", ok: true }, { id: "b", level: "should", ok: false }]).ready).toBe(true);
    expect(summarize([{ id: "a", level: "must", ok: false }]).ready).toBe(false);
  });
});
