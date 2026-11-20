import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { STAGES } from "@/features/stage/stage";

const bodySchema = z.object({ stage: z.enum(STAGES) });

/** The student chooses (or changes) the school stage that decides which curriculum he sees. */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { stage } = bodySchema.parse(await request.json());
    const { error } = await supabase.from("profiles").update({ stage }).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ stage });
  } catch (error) {
    return handleApiError(error);
  }
}
