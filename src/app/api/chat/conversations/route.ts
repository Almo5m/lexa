import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createConversation } from "@/features/chat/server";

const bodySchema = z.object({ from: z.string().uuid().optional() });

/** Starts a conversation, optionally continuing a full one (it starts with the old one's summary). */
export async function POST(request: Request) {
  try {
    const [{ user }, settings] = await Promise.all([requireUser(), loadSettings()]);
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const id = await createConversation(createSupabaseAdminClient(), user.id, settings, body.from);
    if (!id) throw new HttpError(503, "chat_not_ready");
    return NextResponse.json({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
