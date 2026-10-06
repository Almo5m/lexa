import { describe, expect, it, vi } from "vitest";
import { isTransientError, runWithFallback } from "@/features/ai/retry";

const overloaded = () =>
  new Error('{"error":{"code":503,"message":"high demand","status":"UNAVAILABLE"}}');
const noSleep = vi.fn(async (_ms: number) => {});

describe("isTransientError", () => {
  it("recognises Gemini overload and quota errors", () => {
    expect(isTransientError(overloaded())).toBe(true);
    expect(isTransientError(new Error("RESOURCE_EXHAUSTED"))).toBe(true);
    expect(isTransientError(Object.assign(new Error("x"), { status: 429 }))).toBe(true);
  });
  it("does not treat parsing or validation problems as transient", () => {
    expect(isTransientError(new SyntaxError("Unexpected token"))).toBe(false);
    expect(isTransientError(new Error("empty_response"))).toBe(false);
    expect(isTransientError(Object.assign(new Error("bad"), { status: 400 }))).toBe(false);
  });
});

describe("runWithFallback", () => {
  it("retries the same model before giving up on it", async () => {
    const attempt = vi.fn()
      .mockRejectedValueOnce(overloaded())
      .mockResolvedValueOnce("ok");
    const result = await runWithFallback(["main", "backup"], attempt, { retriesPerModel: 2, baseDelayMs: 1, sleep: noSleep });
    expect(result).toEqual({ value: "ok", model: "main" });
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it("falls back to the second model when the first stays overloaded", async () => {
    const attempt = vi.fn(async (model: string) => {
      if (model === "main") throw overloaded();
      return "from-backup";
    });
    const result = await runWithFallback(["main", "backup"], attempt, { retriesPerModel: 1, baseDelayMs: 1, sleep: noSleep });
    expect(result).toEqual({ value: "from-backup", model: "backup" });
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it("stops immediately on a non-transient error", async () => {
    const attempt = vi.fn().mockRejectedValue(new Error("empty_response"));
    await expect(
      runWithFallback(["main", "backup"], attempt, { retriesPerModel: 2, baseDelayMs: 1, sleep: noSleep }),
    ).rejects.toThrow("empty_response");
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("throws the last error when everything is overloaded, and skips duplicate models", async () => {
    const attempt = vi.fn().mockRejectedValue(overloaded());
    await expect(
      runWithFallback(["same", "same"], attempt, { retriesPerModel: 1, baseDelayMs: 1, sleep: noSleep }),
    ).rejects.toThrow();
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it("waits longer between each retry", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const attempt = vi.fn().mockRejectedValue(overloaded());
    await runWithFallback(["main"], attempt, { retriesPerModel: 2, baseDelayMs: 100, sleep }).catch(() => {});
    expect(sleep.mock.calls.map((call) => call[0])).toEqual([100, 200]);
  });
});
