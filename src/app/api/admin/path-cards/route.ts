import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requestCards } from "@/features/ai/cards";
import { PATH_SIZE } from "@/features/curriculum";
import { GENERATE_BATCH, cardsToCsv, mergeCurated, missingEntries, parseStoredCard, type StoredPathCard } from "@/features/curriculum/path-cards";

export const maxDuration = 60;

const bodySchema = z.object({ limit: z.number().int().min(1).max(GENERATE_BATCH).optional() });

async function readStored() {
  const { data, error } = await createSupabaseAdminClient().from("path_cards").select("term, card, reviewed").order("term");
  if (error) throw error;
  return data ?? [];
}

/** How many words have a finished card, or the whole set as a CSV file for the teacher. */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const stored = await readStored();
    if (new URL(request.url).searchParams.get("format") === "csv") {
      const rows: StoredPathCard[] = stored.flatMap((row) => {
        const card = parseStoredCard(row.card);
        return card ? [{ term: row.term, card, reviewed: row.reviewed }] : [];
      });
      return new NextResponse(cardsToCsv(rows), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="path-cards.csv"' },
      });
    }
    return NextResponse.json({ total: PATH_SIZE, ready: stored.length, reviewed: stored.filter((row) => row.reviewed).length });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Writes the next few missing cards and saves them for every student. The admin panel calls this again and again
 * until nothing is missing, so a failure in the middle loses nothing: the next call picks up where this one stopped.
 */
export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin();
    const { limit = GENERATE_BATCH } = bodySchema.parse(await request.json().catch(() => ({})));
    const settings = await loadSettings();
    const db = createSupabaseAdminClient();

    const have = new Set((await readStored()).map((row) => row.term));
    const batch = missingEntries(have, limit);
    if (batch.length === 0) return NextResponse.json({ saved: 0, skipped: [], remaining: 0 });

    const result = await requestCards(
      user.id,
      settings.aiModel,
      settings.aiFallbackModel,
      batch.map((entry) => entry.en),
      "",
      Object.fromEntries(batch.map((entry) => [entry.en, entry.ar])),
    );

    const rows = batch.flatMap((entry) => {
      const card = result.cards.find((item) => item.term.toLowerCase() === entry.en);
      return card ? [{ term: entry.en, card: mergeCurated(entry, card) }] : [];
    });
    if (rows.length > 0) {
      const { error } = await db.from("path_cards").upsert(rows, { onConflict: "term" });
      if (error) throw error;
    }

    const saved = new Set(rows.map((row) => row.term));
    return NextResponse.json({
      saved: rows.length,
      skipped: batch.filter((entry) => !saved.has(entry.en)).map((entry) => entry.en),
      remaining: PATH_SIZE - have.size - rows.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
