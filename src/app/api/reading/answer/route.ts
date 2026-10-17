import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings-server";
import { applyProgress } from "@/features/gamification/award";
import { toDateKey } from "@/features/gamification/streak";
import type { Passage, StoredAnswer } from "@/features/reading/schemas";
import { gradeChoice, toView } from "@/features/reading/view";

const bodySchema = z.object({ index: z.number().int().min(0).max(2), choice: z.number().int().min(0).max(2) });

/** One answer at a time, in order. The server decides if it is right and only then shows the correct option. */
export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const { index, choice } = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    const { data: row } = await db
      .from("reading_sessions")
      .select("id, passage, words, answers")
      .eq("user_id", user.id)
      .eq("day", toDateKey(new Date()))
      .maybeSingle();
    if (!row) throw new HttpError(404, "no_reading_today");

    const passage = row.passage as Passage;
    const answers = (row.answers ?? []) as StoredAnswer[];
    let xpGained = 0;

    // A repeated or out-of-order request changes nothing: the stored answers are the truth.
    if (index === answers.length) {
      let graded: StoredAnswer;
      try {
        graded = gradeChoice(passage, index, choice);
      } catch {
        throw new HttpError(400, "invalid_choice");
      }
      answers.push(graded);
      const done = answers.length >= passage.questions.length;
      const { error } = await db
        .from("reading_sessions")
        .update({ answers, completed_at: done ? new Date().toISOString() : null })
        .eq("id", row.id);
      if (error) throw error;
      if (done) {
        const settings = await loadSettings();
        if (settings.xpReading > 0) {
          const result = await applyProgress(user.id, { xp: settings.xpReading }, settings);
          xpGained = settings.xpReading + result.bonusXp;
        }
      }
    } else if (index > answers.length) {
      throw new HttpError(400, "answer_in_order");
    }

    return NextResponse.json({ view: toView(passage, row.words as string[], answers), xpGained });
  } catch (error) {
    return handleApiError(error);
  }
}
