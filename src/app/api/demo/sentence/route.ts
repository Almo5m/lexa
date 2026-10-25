import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { callGeminiJson } from "@/features/ai/gemini";
import { SENTENCE_GRADE_SYSTEM } from "@/features/ai/prompts";
import { sentenceGradeSchema } from "@/features/translate/schemas";
import { sentenceMentionsWord } from "@/features/srs/judge";
import { guardDemoRequest } from "@/features/demo/guard";
import { DEMO_WORD } from "@/features/demo/limits";

export const maxDuration = 30;

const bodySchema = z.object({
  word: z.string().trim().regex(DEMO_WORD),
  sentence: z.string().trim().min(2).max(200),
});

/** Public: the visitor writes a sentence with the word and Bo checks it, the same way the real review does. */
export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const settings = await loadSettings();
    await guardDemoRequest(request, settings);

    const word = body.word.toLowerCase();
    if (!sentenceMentionsWord(body.sentence, word)) {
      return NextResponse.json({
        correct: false,
        correctedVersion: "",
        explanationAr: `الجملة مفيهاش كلمة **${word}**. جرب تكتب جملة بيها.`,
      });
    }

    const graded = await callGeminiJson(
      {
        userId: null,
        feature: "demo",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: SENTENCE_GRADE_SYSTEM,
        prompt: `Target word: ${word}\nStudent sentence: ${body.sentence}`,
        temperature: 0.2,
      },
      sentenceGradeSchema,
    );
    return NextResponse.json({
      correct: graded.usedWord && graded.targetWordCorrect && graded.score >= 0.6,
      correctedVersion: graded.correctedVersion,
      explanationAr: graded.explanationAr,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
