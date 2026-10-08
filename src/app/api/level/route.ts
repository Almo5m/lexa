import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { BAND_COUNT, PSEUDO_WORDS, WORD_BANK } from "@/features/levels/bank";
import { PSEUDO_COUNT, REAL_PER_BAND, scorePlacement, type TestItem } from "@/features/levels/placement";

const bodySchema = z.object({
  answers: z
    .array(z.object({ word: z.string().max(40), known: z.boolean() }))
    .length(BAND_COUNT * REAL_PER_BAND + PSEUDO_COUNT),
});

function bandOf(word: string): number | null | undefined {
  if (PSEUDO_WORDS.includes(word)) return null;
  for (let band = 1; band <= BAND_COUNT; band++) if (WORD_BANK[band].includes(word)) return band;
  return undefined;
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const body = bodySchema.parse(await request.json());

    const seen = new Set<string>();
    const items: TestItem[] = [];
    for (const answer of body.answers) {
      const band = bandOf(answer.word);
      if (band === undefined || seen.has(answer.word)) throw new HttpError(400, "invalid_input");
      seen.add(answer.word);
      items.push({ word: answer.word, band });
    }
    const perBand = (band: number | null) => items.filter((item) => item.band === band).length;
    for (let band = 1; band <= BAND_COUNT; band++) {
      if (perBand(band) !== REAL_PER_BAND) throw new HttpError(400, "invalid_input");
    }
    if (perBand(null) !== PSEUDO_COUNT) throw new HttpError(400, "invalid_input");

    const known = new Set(body.answers.filter((answer) => answer.known).map((answer) => answer.word));
    const result = scorePlacement(items, known);

    if (result.reliable) {
      const { error } = await createSupabaseAdminClient()
        .from("profiles")
        .update({ level_band: result.level, level_tested_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    }

    return NextResponse.json({ level: result.level, reliable: result.reliable });
  } catch (error) {
    return handleApiError(error);
  }
}
