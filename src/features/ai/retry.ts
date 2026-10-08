import { classifyAiError } from "./errors";

export function isTransientError(error: unknown): boolean {
  const kind = classifyAiError(error);
  return kind === "busy" || kind === "quota";
}

export function isModelUnavailableError(error: unknown): boolean {
  return classifyAiError(error) === "model";
}

export interface FallbackOptions {
  retriesPerModel: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Tries the models in order.
 * - busy (503 and friends): wait and retry the same model, then move on.
 * - quota (429): move on at once, because retrying burns more quota.
 * - model (404, retired): move on at once.
 * - auth or anything else: stop, because another model will not help.
 * When every model failed, the most useful error is thrown: busy and quota first.
 */
export async function runWithFallback<T>(
  models: string[],
  attempt: (model: string) => Promise<T>,
  options: FallbackOptions,
): Promise<{ value: T; model: string }> {
  const sleep = options.sleep ?? defaultSleep;
  const unique = [...new Set(models.filter(Boolean))];
  let lastError: unknown;
  let temporaryError: unknown;

  for (const model of unique) {
    for (let tries = 0; tries <= options.retriesPerModel; tries++) {
      try {
        return { value: await attempt(model), model };
      } catch (error) {
        lastError = error;
        const kind = classifyAiError(error);
        if (kind === "auth" || kind === "other") throw error;
        if (kind === "model") break;
        temporaryError = error;
        if (kind === "quota") break;
        if (tries < options.retriesPerModel) await sleep(options.baseDelayMs * 2 ** tries);
      }
    }
  }
  throw temporaryError ?? lastError;
}
