import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { applyAnswer } from "@/features/srs/apply";

const bodySchema = z.object({
  wordId: z.string().uuid(),
  chosenId: z.string().uuid(),
  combo: z.number().int().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();
    const body = bodySchema.parse(await request.json());

    const { data: word } = await supabase.from("words").select("*").eq("id", body.wordId).single();
    if (!word) throw new HttpError(404, "word_not_found");

    const correct = body.chosenId === body.wordId;
    const outcome = await applyAnswer({
      supabase,
      userId: user.id,
      word,
      mode: "quiz",
      grade: correct ? "good" : "again",
      settings,
      combo: body.combo,
    });

    return NextResponse.json({ correct, answer: word.term, ...outcome });
  } catch (error) {
    return handleApiError(error);
  }
}
