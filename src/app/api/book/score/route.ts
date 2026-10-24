import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { grammarUnit } from "@/features/grammar";
import { listeningTask } from "@/features/listening/tasks";
import { clampScore } from "@/features/book/progress";
import { saveBookScore } from "@/features/book/save";

const bodySchema = z.object({
  kind: z.enum(["grammar", "listening"]),
  itemId: z.string().max(20),
  score: z.number().int().min(0).max(100),
});

/** Grammar and listening results. The maximum comes from our own content, so a score can never be worth more than the item. */
export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const max = body.kind === "grammar" ? grammarUnit(body.itemId)?.exercises.length : listeningTask(body.itemId)?.questions.length;
    if (!max) throw new HttpError(404, "item_not_found");
    await saveBookScore(user.id, body.itemId, body.kind, clampScore(body.score, max), max);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
