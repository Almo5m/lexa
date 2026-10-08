import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import type { Grade } from "@/features/srs/types";
import { applyAnswer } from "@/features/srs/apply";
import { normalizeWord } from "@/features/words/clean";

const bodySchema = z.object({
  wordId: z.string().uuid(),
  mode: z.enum(["recall", "write", "listen"]),
  grade: z.enum(["again", "hard", "good", "easy"]).optional(),
  answer: z.string().max(60).optional(),
  hintUsed: z.boolean().optional(),
  combo: z.number().int().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();
    const body = bodySchema.parse(await request.json());

    const { data: word } = await supabase.from("words").select("*").eq("id", body.wordId).single();
    if (!word) throw new HttpError(404, "word_not_found");

    let grade: Grade;
    if (body.mode === "recall") {
      if (!body.grade) throw new HttpError(400, "grade_required");
      grade = body.grade;
    } else {
      if (body.answer === undefined) throw new HttpError(400, "answer_required");
      const correct = normalizeWord(body.answer) === word.term;
      grade = correct ? (body.hintUsed ? "hard" : "good") : "again";
    }

    const outcome = await applyAnswer({
      supabase,
      userId: user.id,
      word,
      mode: body.mode,
      grade,
      settings,
      combo: body.combo,
    });

    return NextResponse.json({
      correct: grade !== "again",
      grade,
      answer: word.term,
      ...outcome,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
