import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildQuestions } from "@/features/challenge/questions";
import { loadPool } from "@/features/challenge/server";
import { makeDuelCode } from "@/features/duel/code";
import { isMissingDuelTable } from "@/features/duel/server";

const MAX_PER_DAY = 10;

/** Starts a duel: a short code and five questions that everyone who opens the link gets. Ten new duels a day per student. */
export async function POST() {
  try {
    const { user } = await requireUser();
    const db = createSupabaseAdminClient();

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const recent = await db.from("duels").select("code", { count: "exact", head: true }).eq("creator", user.id).gte("created_at", since);
    if (isMissingDuelTable(recent.error)) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if (recent.error) throw recent.error;
    if ((recent.count ?? 0) >= MAX_PER_DAY) return NextResponse.json({ error: "too_many" }, { status: 429 });

    const pool = await loadPool(db);
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = makeDuelCode();
      const questions = buildQuestions(pool, `${code}:${Date.now()}`);
      if (questions.length === 0) return NextResponse.json({ error: "no_challenge" }, { status: 404 });
      const { error } = await db.from("duels").insert({ code, creator: user.id, questions });
      if (!error) return NextResponse.json({ code });
      if (error.code !== "23505") throw error;
    }
    return NextResponse.json({ error: "busy" }, { status: 503 });
  } catch (error) {
    return handleApiError(error);
  }
}
