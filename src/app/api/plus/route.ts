import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { daysLeft, isPlus } from "@/features/plus/plan";
import { loadPlusUntil } from "@/features/plus/server";

/** Whether this student has Plus, and for how long. */
export async function GET() {
  try {
    const { user } = await requireUser();
    const until = await loadPlusUntil(createSupabaseAdminClient(), user.id);
    return NextResponse.json({ plus: isPlus(until), until, daysLeft: daysLeft(until) });
  } catch (error) {
    return handleApiError(error);
  }
}
