import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { STAGES, chosenStage } from "@/features/stage/stage";

const bodySchema = z.object({ stage: z.enum(STAGES) });

/**
 * A student chooses his stage once. After that it is locked: he contacts us and the admin changes it
 * (the database refuses a student's change too, so calling the API or the table directly does not help).
 */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { stage } = bodySchema.parse(await request.json());
    const { data: current } = await supabase.from("profiles").select("stage").eq("id", user.id).single();
    if (chosenStage(current?.stage) !== null) throw new HttpError(403, "stage_locked");
    const { error } = await supabase.from("profiles").update({ stage }).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ stage });
  } catch (error) {
    return handleApiError(error);
  }
}
