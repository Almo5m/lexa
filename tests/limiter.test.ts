import { describe, expect, it } from "vitest";
import { Limiter } from "@/features/ai/limiter";
import { classifyAiError } from "@/features/ai/errors";
import { runWithFallback } from "@/features/ai/retry";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Limiter", () => {
  it("never runs more jobs at once than allowed, and runs all of them", async () => {
    const limiter = new Limiter(2, 1_000);
    let running = 0;
    let peak = 0;
    const job = async () => {
      running++;
      peak = Math.max(peak, running);
      await wait(15);
      running--;
      return 1;
    };
    const results = await Promise.all(Array.from({ length: 6 }, () => limiter.run(job)));
    expect(results).toHaveLength(6);
    expect(peak).toBe(2);
  });

  it("fails fast with a quota-like error when the queue wait is too long", async () => {
    const limiter = new Limiter(1, 20);
    const slow = limiter.run(() => wait(80));
    const rejected = await limiter.run(async () => 1).catch((error) => error);
    expect(classifyAiError(rejected)).toBe("quota");
    await slow;
  });

  it("frees the slot even when a job throws", async () => {
    const limiter = new Limiter(1, 100);
    await limiter.run(async () => {
      throw new Error("boom");
    }).catch(() => {});
    await expect(limiter.run(async () => "ok")).resolves.toBe("ok");
  });
});

describe("timeouts", () => {
  it("are recognised from the error name and from the message", () => {
    expect(classifyAiError(Object.assign(new Error("x"), { name: "TimeoutError" }))).toBe("timeout");
    expect(classifyAiError(Object.assign(new Error("x"), { name: "AbortError" }))).toBe("timeout");
    expect(classifyAiError(new Error("The operation was aborted due to timeout"))).toBe("timeout");
    expect(classifyAiError(new Error("deadline: no answer in time"))).toBe("timeout");
    expect(classifyAiError(new Error("fetch failed"))).toBe("busy");
  });

  it("move to the backup model without retrying the slow one", async () => {
    const calls: string[] = [];
    const result = await runWithFallback(
      ["slow", "backup"],
      async (model) => {
        calls.push(model);
        if (model === "slow") throw Object.assign(new Error("t"), { name: "TimeoutError" });
        return "ok";
      },
      { retriesPerModel: 2, baseDelayMs: 1, sleep: async () => {} },
    );
    expect(result.model).toBe("backup");
    expect(calls).toEqual(["slow", "backup"]);
  });
});
