import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ownConversation, refreshSummary } from "@/features/chat/server";

const bodySchema = z.object({ conversationId: z.string().uuid() });

/** Called by the chat screen after an answer. Does nothing until enough older messages have gathered. */
export async function POST(request: Request) {
  try {
    const [{ user }, settings] = await Promise.all([requireUser(), loadSettings()]);
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();
    const conversation = await ownConversation(db, user.id, body.conversationId);
    if (!conversation) return NextResponse.json({ ok: true });
    try {
      await refreshSummary(db, user.id, conversation, settings);
    } catch {
      // The summary only saves cost; failing now means it is tried again after the next message.
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
