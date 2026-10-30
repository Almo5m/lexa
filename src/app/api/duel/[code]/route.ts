import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { SECONDS_TOTAL, scoreAnswers, toPublic } from "@/features/challenge/questions";
import { isDuelCode } from "@/features/duel/code";
import { loadDuel, standings } from "@/features/duel/server";

const bodySchema = z.object({ answers: z.array(z.number().int().min(0).max(3).nullable()).max(10) });
type Params = { params: Promise<{ code: string }> };

/** The duel's questions without answers, or this student's result and the scores of everyone who played. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { user } = await requireUser();
    const { code } = await params;
    if (!isDuelCode(code)) return NextResponse.json({ available: false });
    const db = createSupabaseAdminClient();
    const duel = await loadDuel(db, code);
    if (!duel) return NextResponse.json({ available: false });

    const mine = await db.from("duel_entries").select("score").eq("code", code).eq("user_id", user.id).maybeSingle();
    if (mine.error) throw mine.error;
    if (mine.data) {
      return NextResponse.json({ available: true, done: { score: mine.data.score, max: duel.questions.length }, questions: [], seconds: SECONDS_TOTAL, standings: await standings(db, code, duel.creator, user.id) });
    }
    return NextResponse.json({ available: true, done: null, questions: toPublic(duel.questions), seconds: SECONDS_TOTAL });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Scores on the server, once per student per duel. Duels give no XP, so they cannot be farmed. */
export async function POST(request: Request, { params }: Params) {
  try {
    const { user } = await requireUser();
    const { code } = await params;
    if (!isDuelCode(code)) return NextResponse.json({ error: "no_duel" }, { status: 404 });
    const { answers } = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();
    const duel = await loadDuel(db, code);
    if (!duel) return NextResponse.json({ error: "no_duel" }, { status: 404 });

    const score = scoreAnswers(duel.questions, answers);
    const { error } = await db.from("duel_entries").insert({ code, user_id: user.id, score });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "already_done" }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ score, max: duel.questions.length, xp: 0, correct: duel.questions.map((q) => q.answer), standings: await standings(db, code, duel.creator, user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
