import { NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings-server";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";
import { READING_SYSTEM } from "@/features/ai/prompts";
import { toDateKey } from "@/features/gamification/streak";
import { passageSchema, type Passage, type StoredAnswer } from "@/features/reading/schemas";
import { MIN_READING_WORDS, pickReadingWords, readingLevel, usesEnoughWords } from "@/features/reading/select";
import { toView } from "@/features/reading/view";

export const maxDuration = 60;

const ATTEMPTS = 2;

/** Today's reading text. The first call of the day writes it; every later call returns the same one. */
export async function POST() {
  try {
    const { supabase, user } = await requireUser();
    const db = createSupabaseAdminClient();
    const day = toDateKey(new Date());

    const existing = await load(db, user.id, day);
    if (existing) return NextResponse.json(toView(existing.passage, existing.words, existing.answers));

    const { data: rows, error } = await supabase
      .from("words")
      .select("term, last_reviewed_at")
      .eq("card_status", "ready")
      .not("last_reviewed_at", "is", null)
      .order("last_reviewed_at", { ascending: false })
      .limit(40);
    if (error) throw error;
    const words = pickReadingWords(rows ?? []);
    if (words.length < MIN_READING_WORDS) throw new HttpError(409, "not_enough_words");

    const settings = await loadSettings();
    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const { data: profile } = await supabase.from("profiles").select("level_band").eq("id", user.id).single();
    const level = readingLevel(words, profile?.level_band ?? null);

    let passage: Passage | null = null;
    for (let attempt = 0; attempt < ATTEMPTS && !passage; attempt += 1) {
      const candidate = await callGeminiJson(
        {
          userId: user.id,
          feature: "reading",
          model: settings.aiModel,
          fallbackModel: settings.aiFallbackModel,
          system: READING_SYSTEM,
          prompt: `Level: ${level}\nTarget words: ${JSON.stringify(words)}`,
          temperature: 0.7,
        },
        passageSchema,
      );
      if (usesEnoughWords(candidate.text, words)) passage = candidate;
    }
    if (!passage) throw new HttpError(502, "reading_failed");

    const { error: insertError } = await db.from("reading_sessions").insert({ user_id: user.id, day, words, passage });
    if (insertError) {
      // Two tabs asked at once: the other one won, so return its text.
      const winner = await load(db, user.id, day);
      if (winner) return NextResponse.json(toView(winner.passage, winner.words, winner.answers));
      throw insertError;
    }
    return NextResponse.json(toView(passage, words, []));
  } catch (error) {
    return handleApiError(error);
  }
}

async function load(db: ReturnType<typeof createSupabaseAdminClient>, userId: string, day: string) {
  const { data } = await db.from("reading_sessions").select("passage, words, answers").eq("user_id", userId).eq("day", day).maybeSingle();
  if (!data) return null;
  return { passage: data.passage as Passage, words: data.words as string[], answers: (data.answers ?? []) as StoredAnswer[] };
}
