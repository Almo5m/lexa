import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { cleanInterests } from "@/features/profile/interests";
import { DAILY_MINUTES } from "@/features/curriculum/session-plan";

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

const minutesSchema = z.object({ dailyMinutes: z.union(DAILY_MINUTES.map((minutes) => z.literal(minutes)) as [z.ZodLiteral<15>, z.ZodLiteral<30>, z.ZodLiteral<45>]) });

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { dailyMinutes } = minutesSchema.parse(await request.json());
    const { error } = await supabase.from("profiles").update({ daily_minutes: dailyMinutes }).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ dailyMinutes });
  } catch (error) {
    return handleApiError(error);
  }
}
