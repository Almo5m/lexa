/**
 * fetch for the routes that call the AI. Two protections the plain fetch does not give:
 * 1. A time limit until the answer starts, so the student never waits in silence forever.
 * 2. One automatic second try when the server says the AI is busy or the connection dropped.
 * It never repeats a request that failed for a reason waiting cannot fix (limit reached, bad input, signed out).
 * Streaming answers work too: the limit covers only the wait for the first bytes.
 */
const WAIT_FOR_ANSWER_MS = 40_000;
const RETRY_AFTER_MS = 1_500;
const RETRYABLE_ERRORS = new Set(["ai_busy", "server_error"]);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function once(url: string, init: RequestInit | undefined, waitMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), waitMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAi(url: string, init?: RequestInit, options: { waitMs?: number; retries?: number } = {}): Promise<Response> {
  const waitMs = options.waitMs ?? WAIT_FOR_ANSWER_MS;
  const retries = options.retries ?? 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await once(url, init, waitMs);
      if (response.ok || attempt === retries || ![502, 503, 504].includes(response.status)) return response;
      // Look at the reason without using up the body the caller will read.
      const reason = await response.clone().json().then((body: { error?: string }) => body.error ?? "", () => "");
      if (reason && !RETRYABLE_ERRORS.has(reason)) return response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    }
    await sleep(RETRY_AFTER_MS);
  }
  throw lastError;
}
