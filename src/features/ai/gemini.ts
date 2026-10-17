import { after } from "next/server";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { z } from "zod";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { classifyAiError, readableAiMessage } from "./errors";
import { runWithFallback } from "./retry";

export type AiFeature = "extract" | "cards" | "tutor" | "translate" | "review" | "demo" | "talk" | "reading";

export class AiLimitError extends Error {
  constructor() {
    super("daily_ai_limit_reached");
  }
}

export class AiBusyError extends Error {
  constructor() {
    super("ai_busy");
  }
}

/** The model name or the key is wrong, so waiting will not help. The admin must act. */
export class AiUnavailableError extends Error {
  constructor() {
    super("ai_unavailable");
  }
}

export class AiDisabledError extends Error {
  constructor() {
    super("ai_feature_disabled");
  }
}

let client: GoogleGenAI | null = null;

export function getClient(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: serverEnv.geminiApiKey() });
  return client;
}

export async function assertWithinDailyLimit(userId: string, limit: number): Promise<void> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await createSupabaseAdminClient()
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  if ((count ?? 0) >= limit) throw new AiLimitError();
}

/** Writes the usage row after the response is sent, so logging never makes the student wait. */
function logUsage(userId: string | null, feature: AiFeature, ok: boolean, startedAt: number, error?: string) {
  const latency = Date.now() - startedAt;
  const job = () => writeUsage(userId, feature, ok, latency, error);
  try {
    after(job);
  } catch {
    void job();
  }
}

async function writeUsage(userId: string | null, feature: AiFeature, ok: boolean, latencyMs: number, error?: string) {
  try {
    await createSupabaseAdminClient().from("ai_usage").insert({
      user_id: userId,
      feature,
      ok,
      latency_ms: latencyMs,
      error: error ? error.slice(0, 300) : null,
    });
  } catch (loggingError) {
    // A failed log line must never turn a good answer into an error.
    console.error("ai_usage insert failed", loggingError);
  }
}

export interface InlineImage {
  mimeType: string;
  base64: string;
}

interface CallOptions {
  /** null for the public landing-page demo, where the visitor has no account. */
  userId: string | null;
  feature: AiFeature;
  model: string;
  fallbackModel?: string;
  system: string;
  prompt: string;
  images?: InlineImage[];
  json?: boolean;
  temperature?: number;
  /** A hard ceiling on the answer length. Shorter answers also arrive faster. */
  maxOutputTokens?: number;
}

/**
 * Answers for students are short, so long "thinking" before them only costs seconds.
 * 2.5 models take a token budget (0 = off). Gemini 3 models take a level. A model that does not
 * understand the setting is retried once without it (see withoutThinkingIfRejected).
 */
function generationConfig(model: string, options: CallOptions, thinking: boolean) {
  return {
    systemInstruction: options.system,
    temperature: options.temperature ?? 0.7,
    ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
    ...(options.json ? { responseMimeType: "application/json" } : {}),
    ...(thinking && /2\.5-flash/.test(model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    ...(thinking && /gemini-3/.test(model) ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } } : {}),
  };
}

async function withoutThinkingIfRejected<T>(
  model: string,
  options: CallOptions,
  run: (config: ReturnType<typeof generationConfig>) => Promise<T>,
): Promise<T> {
  try {
    return await run(generationConfig(model, options, true));
  } catch (error) {
    if (/thinking/i.test(readableAiMessage(error))) return run(generationConfig(model, options, false));
    throw error;
  }
}

function toPublicError(error: unknown): unknown {
  const kind = classifyAiError(error);
  if (kind === "busy" || kind === "quota") return new AiBusyError();
  if (kind === "model" || kind === "auth") return new AiUnavailableError();
  return error;
}

/**
 * Streams the answer as it is written, so the student starts reading in about a second
 * instead of waiting for the whole text. Models can be switched only before the first piece
 * arrives. After that, a failure ends the stream and the caller keeps what was already sent.
 */
export async function* streamGemini(options: CallOptions): AsyncGenerator<string> {
  const startedAt = Date.now();
  const models = [...new Set([options.model, options.fallbackModel ?? ""].filter(Boolean))];
  let lastError: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      let started = false;
      try {
        const stream = await withoutThinkingIfRejected(model, options, (config) =>
          getClient().models.generateContentStream({
            model,
            contents: [{ role: "user", parts: [{ text: options.prompt }] }],
            config,
          }),
        );
        for await (const chunk of stream) {
          const text = chunk.text ?? "";
          if (!text) continue;
          started = true;
          yield text;
        }
        if (!started) throw new Error("empty_response");
        logUsage(options.userId, options.feature, true, startedAt);
        return;
      } catch (error) {
        lastError = error;
        const kind = classifyAiError(error);
        if (started || kind === "auth" || kind === "other") {
          logUsage(options.userId, options.feature, false, startedAt, `[${kind}] ${readableAiMessage(error)}`);
          throw toPublicError(error);
        }
        if (kind === "busy" && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        break;
      }
    }
  }
  const kind = classifyAiError(lastError);
  logUsage(options.userId, options.feature, false, startedAt, `[${kind}] ${readableAiMessage(lastError)}`);
  throw toPublicError(lastError);
}

export async function callGemini(options: CallOptions): Promise<string> {
  const startedAt = Date.now();
  try {
    const parts = [
      ...(options.images ?? []).map((image) => ({
        inlineData: { mimeType: image.mimeType, data: image.base64 },
      })),
      { text: options.prompt },
    ];
    const { value: response } = await runWithFallback(
      [options.model, options.fallbackModel ?? ""],
      (model) => withoutThinkingIfRejected(model, options, (config) =>
        getClient().models.generateContent({ model, contents: [{ role: "user", parts }], config }),
      ),
      { retriesPerModel: 1, baseDelayMs: 500 },
    );
    const text = response.text ?? "";
    if (!text) throw new Error("empty_response");
    logUsage(options.userId, options.feature, true, startedAt);
    return text;
  } catch (error) {
    const kind = classifyAiError(error);
    logUsage(options.userId, options.feature, false, startedAt, `[${kind}] ${readableAiMessage(error)}`);
    throw toPublicError(error);
  }
}

export async function callGeminiJson<T extends z.ZodType>(
  options: Omit<CallOptions, "json">,
  schema: T,
): Promise<z.infer<T>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await callGemini({ ...options, json: true });
      const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      return schema.parse(JSON.parse(cleaned));
    } catch (error) {
      if (error instanceof AiBusyError || error instanceof AiUnavailableError) throw error;
      lastError = error;
    }
  }
  throw lastError;
}
