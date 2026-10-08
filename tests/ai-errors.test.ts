import { describe, expect, it, vi } from "vitest";
import { classifyAiError, readableAiMessage } from "@/features/ai/errors";
import { runWithFallback } from "@/features/ai/retry";

const body = (code: number, status: string, message: string) =>
  new Error(JSON.stringify({ error: { code, status, message } }));

describe("classifyAiError", () => {
  it("separates the five kinds that need different handling", () => {
    expect(classifyAiError(body(503, "UNAVAILABLE", "high demand"))).toBe("busy");
    expect(classifyAiError(body(429, "RESOURCE_EXHAUSTED", "You exceeded your current quota"))).toBe("quota");
    expect(classifyAiError(body(404, "NOT_FOUND", "This model is no longer available to new users"))).toBe("model");
    expect(classifyAiError(body(400, "INVALID_ARGUMENT", "API key not valid. Please pass a valid API key."))).toBe("auth");
    expect(classifyAiError(body(403, "PERMISSION_DENIED", "denied"))).toBe("auth");
    expect(classifyAiError(new SyntaxError("Unexpected token"))).toBe("other");
  });
  it("trusts a numeric status over the text", () => {
    expect(classifyAiError(Object.assign(new Error("x"), { status: 429 }))).toBe("quota");
    expect(classifyAiError(Object.assign(new Error("x"), { status: 404 }))).toBe("model");
  });
});

describe("readableAiMessage", () => {
  it("pulls the sentence out of Gemini's JSON error", () => {
    expect(readableAiMessage(body(503, "UNAVAILABLE", "This model is busy"))).toBe("This model is busy");
  });
  it("keeps plain messages as they are", () => {
    expect(readableAiMessage(new Error("empty_response"))).toBe("empty_response");
  });
});

describe("runWithFallback by error kind", () => {
  const options = { retriesPerModel: 2, baseDelayMs: 1, sleep: async () => {} };

  it("does not retry a quota error on the same model, it moves on at once", async () => {
    const attempt = vi.fn(async (model: string) => {
      if (model === "main") throw body(429, "RESOURCE_EXHAUSTED", "quota");
      return "ok";
    });
    const result = await runWithFallback(["main", "backup"], attempt, options);
    expect(result.model).toBe("backup");
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it("stops at once on a bad key, because another model cannot fix it", async () => {
    const attempt = vi.fn().mockRejectedValue(body(403, "PERMISSION_DENIED", "denied"));
    await expect(runWithFallback(["main", "backup"], attempt, options)).rejects.toThrow(/PERMISSION_DENIED/);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("reports the model problem when both models are retired", async () => {
    const attempt = vi.fn().mockRejectedValue(body(404, "NOT_FOUND", "no longer available"));
    await expect(runWithFallback(["a", "b"], attempt, options)).rejects.toThrow(/NOT_FOUND/);
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it("prefers the temporary error when one model is busy and the other is retired", async () => {
    const attempt = vi.fn(async (model: string) => {
      throw model === "main" ? body(503, "UNAVAILABLE", "busy") : body(404, "NOT_FOUND", "gone");
    });
    await expect(runWithFallback(["main", "gone"], attempt, options)).rejects.toThrow(/UNAVAILABLE/);
  });
});
