import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatCode, makeCodes } from "@/features/plus/codes";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("generate"), count: z.number().int().min(1).max(200), days: z.number().int().min(1).max(400), label: z.string().trim().min(1).max(60) }),
  z.object({ action: z.literal("revokeBatch"), label: z.string().trim().min(1).max(60) }),
]);

/** The admin makes a batch of activation codes (returned once, formatted for printing or sending), or cancels the unused ones of a batch. */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    if (body.action === "generate") {
      const codes = makeCodes(body.count);
      const { error } = await db.from("plus_codes").insert(codes.map((code) => ({ code, days: body.days, label: body.label })));
      if (error) throw error;
      return NextResponse.json({ codes: codes.map(formatCode) });
    }
    const { error } = await db.from("plus_codes").update({ revoked: true }).eq("label", body.label).is("redeemed_at", null);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
