import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAi } from "@/lib/fetch-ai";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe("fetchAi", () => {
  it("retries once when the AI is busy and returns the second answer", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json(503, { error: "ai_busy" })).mockResolvedValueOnce(json(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await fetchAi("/api/x", undefined, { waitMs: 1000 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry when waiting cannot help", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(429, { error: "daily_ai_limit_reached" }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await fetchAi("/api/x");
    expect(response.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry an unavailable or disabled AI", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(503, { error: "ai_unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await fetchAi("/api/x");
    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after the retry and keeps the readable body", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json(503, { error: "ai_busy" }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await fetchAi("/api/x");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((await response.json()).error).toBe("ai_busy");
  });

  it("cuts off a request that never answers", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchAi("/api/x", undefined, { waitMs: 20, retries: 0 })).rejects.toThrow();
  });
});

describe("fetchAi with a stop button", () => {
  it("does not retry after the caller cancelled", async () => {
    const stop = new AbortController();
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))),
    );
    vi.stubGlobal("fetch", fetchMock);
    const pending = fetchAi("/api/x", { signal: stop.signal }, { waitMs: 5000 });
    stop.abort();
    await expect(pending).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
