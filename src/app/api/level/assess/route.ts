import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";
import { LEVEL_ASSESS_SYSTEM } from "@/features/ai/prompts";
import { combineLevels, levelAssessSchema } from "@/features/levels/combine";
import { taskFromId } from "@/features/levels/tasks";

export const maxDuration = 60;

const FRESH_MINUTES = 60;
const bodySchema = z.object({
  answers: z.array(z.object({ id: z.string().max(80), answer: z.string().trim().max(400) })).min(1).max(7),
});

/**
 * Marks the skills part of the level test (translation and writing) and joins it with the vocabulary result the student
 * just got. The questions are looked up here by id, so the student cannot change them. If the AI is busy or the daily limit is
 * reached, the vocabulary level simply stays, and the student is told.
 */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const settings = await loadSettings();

    const { data: profile } = await supabase.from("profiles").select("level_band, level_tested_at").eq("id", user.id).single();
    const testedAt = profile?.level_tested_at ? new Date(profile.level_tested_at).getTime() : 0;
    if (!profile?.level_band || Date.now() - testedAt > FRESH_MINUTES * 60_000) throw new HttpError(400, "invalid_input");
    const vocab = profile.level_band;

    const seen = new Set<string>();
    const tasks = body.answers.map((entry) => {
      const task = taskFromId(entry.id);
      if (!task || seen.has(task.id)) throw new HttpError(400, "invalid_input");
      seen.add(task.id);
      return { task, answer: entry.answer };
    });

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const assessed = await callGeminiJson(
      {
        userId: user.id,
        feature: "level",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: LEVEL_ASSESS_SYSTEM,
        prompt: JSON.stringify(tasks.map(({ task, answer }) => ({ id: task.id, type: task.type, band: task.band, question: task.prompt, answer: answer || "(empty)" }))),
        temperature: 0.2,
      },
      levelAssessSchema,
    );

    const level = combineLevels(vocab, assessed.overallBand);
    const detail = { vocab, ai: assessed.overallBand, summaryAr: assessed.summaryAr };
    const { error } = await createSupabaseAdminClient().from("profiles").update({ level_band: level, level_detail: detail }).eq("id", user.id);
    if (error) throw error;

    return NextResponse.json({ level, vocab, ai: assessed.overallBand, summaryAr: assessed.summaryAr });
  } catch (error) {
    return handleApiError(error);
  }
}
