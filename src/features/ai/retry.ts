const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);
const TRANSIENT_TEXT =
  /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand|fetch failed|ECONNRESET|ETIMEDOUT|deadline/i;

export function isTransientError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (typeof status === "number" && TRANSIENT_STATUS.has(status)) return true;
  const text = error instanceof Error ? error.message : String(error);
  return TRANSIENT_TEXT.test(text);
}

const MODEL_UNAVAILABLE_TEXT = /\b404\b|NOT_FOUND|no longer available|is not found|not supported for/i;

export function isModelUnavailableError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  if (status === 404) return true;
  const text = error instanceof Error ? error.message : String(error);
  return MODEL_UNAVAILABLE_TEXT.test(text);
}

export interface FallbackOptions {
  retriesPerModel: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runWithFallback<T>(
  models: string[],
  attempt: (model: string) => Promise<T>,
  options: FallbackOptions,
): Promise<{ value: T; model: string }> {
  const sleep = options.sleep ?? defaultSleep;
  const unique = [...new Set(models.filter(Boolean))];
  let lastError: unknown;
  let transientError: unknown;

  for (const model of unique) {
    for (let tries = 0; tries <= options.retriesPerModel; tries++) {
      try {
        return { value: await attempt(model), model };
      } catch (error) {
        lastError = error;
        if (isModelUnavailableError(error)) break;
        if (!isTransientError(error)) throw error;
        transientError = error;
        if (tries < options.retriesPerModel) await sleep(options.baseDelayMs * 2 ** tries);
      }
    }
  }
  throw transientError ?? lastError;
}
