import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { cleanInterests } from "@/features/profile/interests";

const bodySchema = z.object({ interests: z.array(z.string()).max(12) });

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const interests = cleanInterests(body.interests);
    const { error } = await supabase.from("profiles").update({ interests, onboarded: true }).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ interests });
  } catch (error) {
    return handleApiError(error);
  }
}
