import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { TUTOR_SYSTEM } from "@/features/ai/prompts";
import { AiDisabledError, assertWithinDailyLimit, streamGemini } from "@/features/ai/gemini";

export const maxDuration = 30;

/** Older turns add time and cost, and Bo only needs the recent ones. */
const HISTORY_TURNS = 8;

const bodySchema = z.object({
  wordId: z.string().uuid().optional(),
  messages: z
    .array(z.object({ role: z.enum(["student", "tutor"]), text: z.string().trim().min(1).max(600) }))
    .min(1)
    .max(12),
});

export async function POST(request: Request) {
  try {
    const [{ supabase, user }, settings] = await Promise.all([requireUser(), loadSettings()]);
    if (!settings.tutorEnabled) throw new AiDisabledError();
    const body = bodySchema.parse(await request.json());
    const messages = body.messages.slice(-HISTORY_TURNS);

    if (messages[messages.length - 1].role !== "student") {
      throw new HttpError(400, "last_message_must_be_student");
    }

    // The word and the daily limit are independent, so they are asked together.
    const [wordResult] = await Promise.all([
      body.wordId
        ? supabase
            .from("words")
            .select("term, card, lapses, wrong_count, correct_count")
            .eq("id", body.wordId)
            .single()
        : Promise.resolve(null),
      assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent),
    ]);

    const word = wordResult?.data;
    const wordContext = word
      ? `Current word: ${word.term}. Card: ${JSON.stringify(word.card)}. Student record: ${word.correct_count} correct, ${word.wrong_count} wrong, ${word.lapses} lapses.\n`
      : "";
    const transcript = messages
      .map((message) => `${message.role === "student" ? "Student" : "Tutor"}: ${message.text}`)
      .join("\n");

    const iterator = streamGemini({
      userId: user.id,
      feature: "tutor",
      model: settings.aiModel,
      fallbackModel: settings.aiFallbackModel,
      system: TUTOR_SYSTEM,
      prompt: `${wordContext}Conversation so far:\n${transcript}\nTutor:`,
      temperature: 0.5,
      maxOutputTokens: 450,
    })[Symbol.asyncIterator]();

    // Wait for the first piece here, so a busy or broken model still returns a clear error with a status code.
    const first = await iterator.next();
    if (first.done) throw new Error("empty_response");

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(first.value));
      },
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) controller.close();
          else controller.enqueue(encoder.encode(next.value));
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        await iterator.return?.(undefined);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
