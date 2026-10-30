import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { applyProgress } from "@/features/gamification/award";
import { toDateKey } from "@/features/gamification/streak";
import { SECONDS_TOTAL, scoreAnswers, toPublic, xpForScore } from "@/features/challenge/questions";
import { challengeForDay, resultForDay } from "@/features/challenge/server";

const bodySchema = z.object({ answers: z.array(z.number().int().min(0).max(3).nullable()).max(10) });

/** Today's challenge: the questions without answers, and whether this student already finished it. */
export async function GET() {
  try {
    const { user } = await requireUser();
    const db = createSupabaseAdminClient();
    const day = toDateKey(new Date());
    const done = await resultForDay(db, user.id, day);
    if (done) return NextResponse.json({ available: true, done, questions: [], seconds: SECONDS_TOTAL });
    const questions = await challengeForDay(db, day);
    return NextResponse.json({ available: questions.length > 0, done: null, questions: toPublic(questions), seconds: SECONDS_TOTAL });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Scores the answers on the server, once per student per day, and gives the XP. The right answers come back for review. */
export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const { answers } = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();
    const day = toDateKey(new Date());

    const questions = await challengeForDay(db, day);
    if (questions.length === 0) return NextResponse.json({ error: "no_challenge" }, { status: 404 });

    const score = scoreAnswers(questions, answers);
    const { error } = await db.from("challenge_results").insert({ user_id: user.id, day, score, max_score: questions.length });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "already_done" }, { status: 409 });
      throw error;
    }
    const xp = xpForScore(score, questions.length);
    await applyProgress(user.id, { xp }, await loadSettings());
    return NextResponse.json({ score, max: questions.length, xp, correct: questions.map((question) => question.answer) });
  } catch (error) {
    return handleApiError(error);
  }
}
