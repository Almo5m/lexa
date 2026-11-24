import { z } from "zod";
import { handleApiError } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AiDisabledError, streamGemini } from "@/features/ai/gemini";
import {
  CHAT_SYSTEM, MESSAGE_MAX_CHARS, RECENT_MESSAGES, buildPrompt, conversationFull, titleFrom, type ChatLine,
} from "@/features/chat/memory";
import { isMissingChatTable, loadAllowance, loadFacts, ownConversation, recentLines } from "@/features/chat/server";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().trim().min(1).max(MESSAGE_MAX_CHARS),
});

export async function POST(request: Request) {
  try {
    const [{ user }, settings] = await Promise.all([requireUser(), loadSettings()]);
    if (!settings.tutorEnabled) throw new AiDisabledError();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    const conversation = await ownConversation(db, user.id, body.conversationId);
    if (!conversation) throw new HttpError(404, "conversation_not_found");
    if (conversationFull(conversation.student_count, settings)) throw new HttpError(409, "conversation_full");

    // Takes one message from today's allowance in one step, so two tabs cannot both pass the limit.
    const allowance = await loadAllowance(db, user.id, settings);
    const taken = await db.rpc("take_chat_message", { p_user: user.id, p_limit: allowance.limit });
    if (taken.error) {
      if (isMissingChatTable(taken.error)) throw new HttpError(503, "chat_not_ready");
      throw taken.error;
    }
    if (taken.data === -1) throw new HttpError(429, "chat_limit_reached");
    const usedNow: number = taken.data;
    const refund = async () => {
      await db.rpc("refund_chat_message", { p_user: user.id });
    };

    let iterator: AsyncIterator<string>;
    let first: IteratorResult<string>;
    try {
      const [facts, before] = await Promise.all([
        loadFacts(db, user.id),
        recentLines(db, user.id, conversation.id, RECENT_MESSAGES - 1),
      ]);
      const recent: ChatLine[] = [...before, { role: "student", text: body.text }];
      iterator = streamGemini({
        userId: user.id,
        feature: "chat",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: CHAT_SYSTEM,
        prompt: buildPrompt({ facts, summary: conversation.summary, recent }),
        temperature: 0.6,
        maxOutputTokens: 500,
      })[Symbol.asyncIterator]();
      first = await iterator.next();
      if (first.done) throw new Error("empty_response");
    } catch (error) {
      // The student gets no answer, so he does not pay for the message.
      await refund();
      throw error;
    }

    // The answer is on its way: store the student's message now, and Bo's answer when the stream ends.
    const studentCount = conversation.student_count + 1;
    await db.from("chat_messages").insert({ conversation_id: conversation.id, user_id: user.id, role: "student", text: body.text });
    await db
      .from("chat_conversations")
      .update({
        message_count: conversation.message_count + 1,
        student_count: studentCount,
        updated_at: new Date().toISOString(),
        ...(conversation.title ? {} : { title: titleFrom(body.text) }),
      })
      .eq("id", conversation.id)
      .eq("user_id", user.id);

    let reply = first.value;
    let saved = false;
    const saveReply = async () => {
      if (saved || !reply.trim()) return;
      saved = true;
      await db.from("chat_messages").insert({ conversation_id: conversation.id, user_id: user.id, role: "tutor", text: reply.slice(0, 4000) });
      await db
        .from("chat_conversations")
        .update({ message_count: conversation.message_count + 2, updated_at: new Date().toISOString() })
        .eq("id", conversation.id)
        .eq("user_id", user.id);
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(first.value));
      },
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) {
            await saveReply();
            controller.close();
          } else {
            reply += next.value;
            controller.enqueue(encoder.encode(next.value));
          }
        } catch (error) {
          await saveReply();
          controller.error(error);
        }
      },
      async cancel() {
        await saveReply();
        await iterator.return?.(undefined);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
        "X-Chat-Used": String(usedNow),
        "X-Chat-Limit": String(allowance.limit),
        "X-Chat-Count": String(studentCount),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
