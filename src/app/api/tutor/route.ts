import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { TUTOR_SYSTEM } from "@/features/ai/prompts";
import { AiDisabledError, assertWithinDailyLimit, callGemini } from "@/features/ai/gemini";

export const maxDuration = 30;

const bodySchema = z.object({
  wordId: z.string().uuid().optional(),
  messages: z
    .array(z.object({ role: z.enum(["student", "tutor"]), text: z.string().trim().min(1).max(600) }))
    .min(1)
    .max(12),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();
    if (!settings.tutorEnabled) throw new AiDisabledError();
    const body = bodySchema.parse(await request.json());

    if (body.messages[body.messages.length - 1].role !== "student") {
      throw new HttpError(400, "last_message_must_be_student");
    }

    let wordContext = "";
    if (body.wordId) {
      const { data: word } = await supabase
        .from("words")
        .select("term, card, lapses, wrong_count, correct_count")
        .eq("id", body.wordId)
        .single();
      if (word) {
        wordContext = `Current word: ${word.term}. Card: ${JSON.stringify(word.card)}. Student record: ${word.correct_count} correct, ${word.wrong_count} wrong, ${word.lapses} lapses.\n`;
      }
    }

    const transcript = body.messages
      .map((message) => `${message.role === "student" ? "Student" : "Tutor"}: ${message.text}`)
      .join("\n");

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const reply = await callGemini({
      userId: user.id,
      feature: "tutor",
      model: settings.aiModel,
      fallbackModel: settings.aiFallbackModel,
      system: TUTOR_SYSTEM,
      prompt: `${wordContext}Conversation so far:\n${transcript}\nTutor:`,
      temperature: 0.6,
    });

    return NextResponse.json({ reply: reply.trim() });
  } catch (error) {
    return handleApiError(error);
  }
}
