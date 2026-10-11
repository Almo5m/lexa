import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { applyAnswer } from "@/features/srs/apply";
import { judgeTypedWord, sentenceGrade, sentenceMentionsWord } from "@/features/srs/judge";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";
import { SENTENCE_GRADE_SYSTEM } from "@/features/ai/prompts";
import { sentenceGradeSchema } from "@/features/translate/schemas";
import type { Grade } from "@/features/srs/types";

export const maxDuration = 60;

const bodySchema = z.object({
  wordId: z.string().uuid(),
  mode: z.enum(["write", "listen", "sentence"]),
  answer: z.string().trim().min(1).max(300),
  hintUsed: z.boolean().optional(),
  combo: z.number().int().min(0).max(100).optional(),
});

/** The student only sends what they typed. The server decides if it is right. */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const [settings, { data: word }] = await Promise.all([
      loadSettings(),
      supabase.from("words").select("*").eq("id", body.wordId).single(),
    ]);
    if (!word) throw new HttpError(404, "word_not_found");

    let grade: Grade;
    let feedback: { correctedVersion: string; explanationAr: string } | null = null;

    if (body.mode === "sentence") {
      if (!sentenceMentionsWord(body.answer, word.term)) {
        grade = "again";
        feedback = { correctedVersion: "", explanationAr: `الجملة مفيهاش كلمة **${word.term}**. جرب تكتب جملة بيها.` };
      } else {
        await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
        const graded = await callGeminiJson(
          {
            userId: user.id,
            feature: "review",
            model: settings.aiModel,
            fallbackModel: settings.aiFallbackModel,
            system: SENTENCE_GRADE_SYSTEM,
            prompt: `Target word: ${word.term}\nStudent sentence: ${body.answer}`,
            temperature: 0.2,
          },
          sentenceGradeSchema,
        );
        grade = sentenceGrade(graded.score, graded.usedWord, graded.targetWordCorrect, Boolean(body.hintUsed));
        feedback = { correctedVersion: graded.correctedVersion, explanationAr: graded.explanationAr };
      }
    } else {
      grade = judgeTypedWord(body.answer, word.term, Boolean(body.hintUsed));
    }

    const outcome = await applyAnswer({
      supabase,
      userId: user.id,
      word,
      mode: body.mode,
      grade,
      settings,
      combo: body.combo,
    });

    return NextResponse.json({
      correct: grade !== "again",
      grade,
      answer: word.term,
      feedback,
      ...outcome,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
