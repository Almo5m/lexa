import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { mergeSettings, settingsSchema } from "@/lib/settings";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const values = settingsSchema.parse(await request.json());
    const { error } = await createSupabaseAdminClient()
      .from("app_settings")
      .update({ values, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw error;
    return NextResponse.json({ settings: mergeSettings(values) });
  } catch (error) {
    return handleApiError(error);
  }
}
