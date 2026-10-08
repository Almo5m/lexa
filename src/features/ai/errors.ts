export type AiErrorKind = "busy" | "quota" | "model" | "auth" | "other";

const BUSY = /\b(500|502|503|504)\b|UNAVAILABLE|overloaded|high demand|fetch failed|ECONNRESET|ETIMEDOUT|deadline/i;
const QUOTA = /\b429\b|RESOURCE_EXHAUSTED|quota|rate limit/i;
const MODEL = /\b404\b|NOT_FOUND|no longer available|is not found|not supported for/i;
const AUTH = /\b(401|403)\b|API key not valid|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|API key expired/i;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function classifyAiError(error: unknown): AiErrorKind {
  const status = (error as { status?: number } | null)?.status;
  if (status === 429) return "quota";
  if (status === 404) return "model";
  if (status === 401 || status === 403) return "auth";
  if (typeof status === "number" && [500, 502, 503, 504].includes(status)) return "busy";

  const text = messageOf(error);
  if (AUTH.test(text)) return "auth";
  if (MODEL.test(text)) return "model";
  if (QUOTA.test(text)) return "quota";
  if (BUSY.test(text)) return "busy";
  return "other";
}

/** Gemini errors arrive as a JSON string. Pull out the human sentence. */
export function readableAiMessage(error: unknown): string {
  const raw = messageOf(error);
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // not JSON, use the text as it is
  }
  return raw;
}
