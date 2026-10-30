import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { parseContestQuestions } from "@/features/contest/parse";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    title: z.string().trim().min(1).max(120),
    prize: z.string().trim().max(200).optional(),
    questionsText: z.string().max(20000),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  }),
  z.object({ action: z.literal("toggle"), id: z.string().uuid(), active: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.string().uuid() }),
]);

/** The admin writes, switches off and deletes contests. If a line of questions is bad, nothing is saved and its number comes back. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (body.action === "add") {
      if (new Date(body.endsAt) <= new Date(body.startsAt)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
      const { questions, problems } = parseContestQuestions(body.questionsText);
      if (problems.length > 0 || questions.length === 0) return NextResponse.json({ error: "bad_lines", lines: problems.map((p) => p.line) }, { status: 400 });
      const { error } = await db.from("contests").insert({ title: body.title, prize: body.prize ?? "", questions, starts_at: body.startsAt, ends_at: body.endsAt });
      if (error) throw error;
    } else if (body.action === "toggle") {
      const { error } = await db.from("contests").update({ active: body.active }).eq("id", body.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("contests").delete().eq("id", body.id);
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
