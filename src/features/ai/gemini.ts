import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";
import { serverEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AiFeature = "extract" | "cards" | "tutor";

export class AiLimitError extends Error {
  constructor() {
    super("daily_ai_limit_reached");
  }
}

export class AiDisabledError extends Error {
  constructor() {
    super("ai_feature_disabled");
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
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
  await createSupabaseAdminClient().from("ai_usage").insert({
    user_id: userId,
    feature,
    ok,
    latency_ms: Date.now() - startedAt,
    error: error ? error.slice(0, 300) : null,
  });
}

export interface InlineImage {
  mimeType: string;
  base64: string;
}

interface CallOptions {
  userId: string;
  feature: AiFeature;
  model: string;
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
    const response = await getClient().models.generateContent({
      model: options.model,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: options.system,
        temperature: options.temperature ?? 0.7,
        ...(options.json ? { responseMimeType: "application/json" } : {}),
      },
    });
    const text = response.text ?? "";
    if (!text) throw new Error("empty_response");
    await logUsage(options.userId, options.feature, true, startedAt);
    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await logUsage(options.userId, options.feature, false, startedAt, message);
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
      lastError = error;
    }
  }
  throw lastError;
}
