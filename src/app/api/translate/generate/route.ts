import { NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";
import { TRANSLATE_GENERATE_SYSTEM } from "@/features/ai/prompts";
import { exerciseBatchSchema } from "@/features/translate/schemas";
import { classifyWord, isDue } from "@/features/srs/scheduler";
import { rowToState, type WordRow } from "@/lib/words";

export const maxDuration = 60;

const EXERCISE_COUNT = 5;

export async function POST() {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();

    const { data } = await supabase
      .from("words")
      .select("id, term, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id")
      .eq("card_status", "ready");
    const rows = (data ?? []) as unknown as WordRow[];
    if (rows.length === 0) throw new HttpError(400, "no_words");

    const now = new Date();
    const rank = (row: WordRow) => {
      const state = rowToState(row);
      if (classifyWord(state, settings) === "weak") return 0;
      if (state.lastReviewedAt !== null && isDue(state, now)) return 1;
      if (state.lastReviewedAt === null) return 2;
      return 3;
    };
    const chosen = [...rows]
      .sort((a, b) => rank(a) - rank(b) || Math.random() - 0.5)
      .slice(0, EXERCISE_COUNT);

    const { data: profile } = await supabase.from("profiles").select("level_band").eq("id", user.id).single();

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const result = await callGeminiJson(
      {
        userId: user.id,
        feature: "translate",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: TRANSLATE_GENERATE_SYSTEM,
        prompt: `Student level: ${profile?.level_band ?? 2} out of 5. Target words: ${JSON.stringify(chosen.map((row) => row.term))}`,
        temperature: 0.8,
      },
      exerciseBatchSchema,
    );

    const idByTerm = new Map(chosen.map((row) => [row.term, row.id]));
    const exercises = result.exercises.flatMap((exercise) => {
      const wordId = idByTerm.get(exercise.term.toLowerCase());
      return wordId ? [{ ...exercise, wordId }] : [];
    });
    if (exercises.length === 0) throw new Error("no_usable_exercises");

    return NextResponse.json({ exercises });
  } catch (error) {
    return handleApiError(error);
  }
}
