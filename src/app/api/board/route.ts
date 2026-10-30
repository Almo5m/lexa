import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isValidNickname, makeNickname } from "@/features/board/nickname";
import { daysUntilReset, weekStartKey } from "@/features/board/week";

const TOP = 20;

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("join"), nickname: z.string().max(40) }),
  z.object({ action: z.literal("leave") }),
]);

function missing(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error) && (error?.code === "42P01" || error?.code === "PGRST205" || error?.code === "PGRST202" || /board_members|weekly_board/.test(error?.message ?? ""));
}

/** This week's board (top 20 and the student's own place), and whether he has joined. Only made-up names leave the server. */
export async function GET() {
  try {
    const { user } = await requireUser();
    const db = createSupabaseAdminClient();
    const now = new Date();

    const member = await db.from("board_members").select("nickname").eq("user_id", user.id).maybeSingle();
    if (missing(member.error)) return NextResponse.json({ available: false });
    if (member.error) throw member.error;

    const board = await db.rpc("weekly_board", { week_start: weekStartKey(now), me: user.id, max_rows: TOP });
    if (missing(board.error)) return NextResponse.json({ available: false });
    if (board.error) throw board.error;

    const rows = (board.data ?? []) as { rank: number; user_id: string; nickname: string; xp: number }[];
    const mine = rows.find((row) => row.user_id === user.id) ?? null;
    return NextResponse.json({
      available: true,
      joined: Boolean(member.data),
      nickname: member.data?.nickname ?? null,
      preview: member.data ? null : makeNickname(),
      rows: rows.filter((row) => row.rank <= TOP).map((row) => ({ rank: Number(row.rank), nickname: row.nickname, xp: Number(row.xp), me: row.user_id === user.id })),
      me: mine ? { rank: Number(mine.rank), xp: Number(mine.xp) } : null,
      daysLeft: daysUntilReset(now),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Join with a made-up name the server checks, or leave the board (the name is deleted). */
export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (body.action === "leave") {
      const { error } = await db.from("board_members").delete().eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (!isValidNickname(body.nickname)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const { error } = await db.from("board_members").upsert({ user_id: user.id, nickname: body.nickname }, { onConflict: "user_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
