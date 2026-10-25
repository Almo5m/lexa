import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { callGeminiJson } from "@/features/ai/gemini";
import { CARDS_SYSTEM } from "@/features/ai/prompts";
import { cardBatchSchema } from "@/features/ai/schemas";
import { guardDemoRequest } from "@/features/demo/guard";
import { DEMO_WORD } from "@/features/demo/limits";

export const maxDuration = 30;

const bodySchema = z.object({ word: z.string().trim().regex(DEMO_WORD) });

/** Public: a visitor types one word and gets a real Bo card. Guarded by per-visitor and daily limits. */
export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const settings = await loadSettings();
    await guardDemoRequest(request, settings);

    const word = body.word.toLowerCase();
    const result = await callGeminiJson(
      {
        userId: null,
        feature: "demo",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: CARDS_SYSTEM,
        prompt: `Write cards for these words: ${JSON.stringify([word])}`,
        temperature: 0.8,
      },
      cardBatchSchema,
    );
    const card = result.cards.find((item) => item.term.toLowerCase() === word) ?? result.cards[0];
    if (!card) return NextResponse.json({ error: "server_error" }, { status: 502 });
    return NextResponse.json({ card });
  } catch (error) {
    return handleApiError(error);
  }
}
