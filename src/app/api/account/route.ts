import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/features/demo/limits";

const nameSchema = z.object({ name: z.string().trim().min(1).max(40) });
const deleteSchema = z.object({ confirm: z.literal(true) });

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { name } = nameSchema.parse(await request.json());
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ name });
  } catch (error) {
    return handleApiError(error);
  }
}

// Deletes the login; every row the student owns goes with it through the foreign keys (on delete cascade).
export async function DELETE(request: Request) {
  try {
    if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) throw new HttpError(403, "forbidden");
    const { supabase, user } = await requireUser();
    deleteSchema.parse(await request.json());
    const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(user.id);
    if (error) throw error;
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
