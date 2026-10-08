import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { classifyAiError, readableAiMessage } from "./errors";
import { runWithFallback } from "./retry";

export type AiFeature = "extract" | "cards" | "tutor" | "translate";

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

async function logUsage(userId: string, feature: AiFeature, ok: boolean, startedAt: number, error?: string) {
  try {
    await createSupabaseAdminClient().from("ai_usage").insert({
      user_id: userId,
      feature,
      ok,
      latency_ms: Date.now() - startedAt,
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
  userId: string;
  feature: AiFeature;
  model: string;
  fallbackModel?: string;
  system: string;
  prompt: string;
  images?: InlineImage[];
  json?: boolean;
  temperature?: number;
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
      (model) =>
        getClient().models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: options.system,
            temperature: options.temperature ?? 0.7,
            ...(options.json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      { retriesPerModel: 2, baseDelayMs: 800 },
    );
    const text = response.text ?? "";
    if (!text) throw new Error("empty_response");
    await logUsage(options.userId, options.feature, true, startedAt);
    return text;
  } catch (error) {
    const kind = classifyAiError(error);
    await logUsage(options.userId, options.feature, false, startedAt, `[${kind}] ${readableAiMessage(error)}`);
    if (kind === "busy" || kind === "quota") throw new AiBusyError();
    if (kind === "model" || kind === "auth") throw new AiUnavailableError();
    throw error;
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
