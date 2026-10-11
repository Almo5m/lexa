import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";
import { TALK_ANALYZE_SYSTEM } from "@/features/ai/prompts";
import { applyProgress } from "@/features/gamification/award";
import { MAX_CHARS, MIN_CHARS, looksEnglish } from "@/features/talk/analyze";
import { talkAnalysisSchema } from "@/features/talk/schemas";
import { topicById } from "@/features/talk/topics";

export const maxDuration = 60;

/** XP is paid for the first few sessions each day only, so the profile can't be farmed. */
const XP_SESSIONS_PER_DAY = 3;

const bodySchema = z.object({
  topic: z.string().max(30),
  text: z.string().trim().min(MIN_CHARS).max(MAX_CHARS),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const topic = topicById(body.topic);
    if (!topic) throw new HttpError(400, "invalid_topic");
    if (!looksEnglish(body.text)) throw new HttpError(400, "not_english");

    const settings = await loadSettings();
    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);

    const analysis = await callGeminiJson(
      {
        userId: user.id,
        feature: "talk",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: TALK_ANALYZE_SYSTEM,
        prompt: `Topic: ${topic.prompt}\nStudent text: ${body.text}`,
        temperature: 0.3,
      },
      talkAnalysisSchema,
    );

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("talk_sessions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString());

    const { error } = await supabase.from("talk_sessions").insert({
      user_id: user.id,
      topic: topic.id,
      text: body.text,
      vocabulary_level: analysis.vocabularyLevel,
      grammar_level: analysis.grammarLevel,
      clarity_level: analysis.clarityLevel,
      mistakes: analysis.mistakes,
    });
    if (error) throw error;

    let xpGained = 0;
    if ((count ?? 0) < XP_SESSIONS_PER_DAY && settings.xpTalkSession > 0) {
      const result = await applyProgress(user.id, { xp: settings.xpTalkSession }, settings);
      xpGained = settings.xpTalkSession + result.bonusXp;
    }

    return NextResponse.json({ analysis, xpGained });
  } catch (error) {
    return handleApiError(error);
  }
}
