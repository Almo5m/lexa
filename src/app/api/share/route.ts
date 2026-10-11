import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { SHARE_DAYS, expiryFrom, hashShareToken, newShareToken } from "@/features/share/token";

/** Makes a new link. Any older link stops working, so there is only ever one. */
export async function POST() {
  try {
    const { user } = await requireUser();
    const db = createSupabaseAdminClient();
    await db.from("share_links").delete().eq("user_id", user.id);

    const token = newShareToken();
    const expiresAt = expiryFrom(new Date());
    const { error } = await db
      .from("share_links")
      .insert({ user_id: user.id, token_hash: hashShareToken(token), expires_at: expiresAt.toISOString() });
    if (error) throw error;

    return NextResponse.json({ token, expiresAt: expiresAt.toISOString(), days: SHARE_DAYS });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Stops the link at once. */
export async function DELETE() {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("share_links").delete().eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
