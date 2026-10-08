import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";
import { TRANSLATE_GRADE_SYSTEM } from "@/features/ai/prompts";
import { gradeSchema } from "@/features/translate/schemas";
import { scoreToGrade, verdictOf } from "@/features/translate/grade";
import { applyAnswer } from "@/features/srs/apply";

export const maxDuration = 60;

const bodySchema = z.object({
  wordId: z.string().uuid(),
  direction: z.enum(["ar2en", "en2ar"]),
  source: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(400),
  combo: z.number().int().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();
    const body = bodySchema.parse(await request.json());

    const { data: word } = await supabase.from("words").select("*").eq("id", body.wordId).single();
    if (!word) throw new HttpError(404, "word_not_found");

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const graded = await callGeminiJson(
      {
        userId: user.id,
        feature: "translate",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: TRANSLATE_GRADE_SYSTEM,
        prompt: [
          `Direction: ${body.direction === "ar2en" ? "Arabic to English" : "English to Arabic"}`,
          `Target word: ${word.term}`,
          `Source sentence: ${body.source}`,
          `Student answer: ${body.answer}`,
        ].join("\n"),
        temperature: 0.2,
      },
      gradeSchema,
    );

    const grade = scoreToGrade(graded.score, graded.targetWordCorrect);
    const outcome = await applyAnswer({
      supabase,
      userId: user.id,
      word,
      mode: "translate",
      grade,
      settings,
      combo: body.combo,
    });

    return NextResponse.json({
      verdict: verdictOf(graded.score),
      correct: grade !== "again",
      targetWordCorrect: graded.targetWordCorrect,
      correctedVersion: graded.correctedVersion,
      naturalVersion: graded.naturalVersion,
      explanationAr: graded.explanationAr,
      ...outcome,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
