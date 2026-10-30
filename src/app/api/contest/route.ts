import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { scoreContest } from "@/features/contest/parse";
import { currentContest } from "@/features/contest/server";

const bodySchema = z.object({ id: z.string().uuid(), answers: z.array(z.number().int().min(0).max(3).nullable()).max(30) });

/** The running contest without its answers, or this student's result. After the end: the top 3 by made-up board name. */
export async function GET() {
  try {
    const { user } = await requireUser();
    const db = createSupabaseAdminClient();
    const { contest, state } = await currentContest(db);
    if (!contest) return NextResponse.json({ state });

    const mine = await db.from("contest_entries").select("score").eq("contest_id", contest.id).eq("user_id", user.id).maybeSingle();
    const base = { state, id: contest.id, title: contest.title, prize: contest.prize, endsAt: contest.endsAt, max: contest.questions.length, mine: mine.data ? mine.data.score : null };
    if (state === "running") {
      return NextResponse.json({ ...base, questions: mine.data ? [] : contest.questions.map((q) => ({ question: q.question, options: q.options })) });
    }
    const top = await db.from("contest_entries").select("user_id, score").eq("contest_id", contest.id).order("score", { ascending: false }).order("created_at", { ascending: true }).limit(3);
    const ids = (top.data ?? []).map((row) => row.user_id);
    const names = ids.length ? await db.from("board_members").select("user_id, nickname").in("user_id", ids) : { data: [] as { user_id: string; nickname: string }[] };
    const nameOf = new Map((names.data ?? []).map((row) => [row.user_id, row.nickname]));
    return NextResponse.json({ ...base, winners: (top.data ?? []).map((row) => ({ nickname: nameOf.get(row.user_id) ?? null, score: row.score, me: row.user_id === user.id })) });
  } catch (error) {
    return handleApiError(error);
  }
}

/** Scores on the server, once per student. */
export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();
    const { contest, state } = await currentContest(db);
    if (!contest || state !== "running" || contest.id !== body.id) return NextResponse.json({ error: "no_contest" }, { status: 404 });

    const score = scoreContest(contest.questions, body.answers);
    const { error } = await db.from("contest_entries").insert({ contest_id: contest.id, user_id: user.id, score });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "already_done" }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ score, max: contest.questions.length });
  } catch (error) {
    return handleApiError(error);
  }
}
