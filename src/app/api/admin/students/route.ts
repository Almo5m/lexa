import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/features/demo/limits";

const bodySchema = z.object({ action: z.literal("delete"), id: z.string().uuid(), confirm: z.literal(true) });

/**
 * Removes a student and everything linked to him (the foreign keys cascade), for a request to delete his data.
 * An admin cannot be deleted from here, and the action is written to the admin log without the student's name or email.
 */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) throw new HttpError(403, "forbidden");
    const { user } = await requireAdmin();
    const body = bodySchema.parse(await request.json());
    const db = createSupabaseAdminClient();

    const { data: target } = await db.from("profiles").select("role").eq("id", body.id).maybeSingle();
    if (!target) throw new HttpError(404, "not_found");
    if (target.role === "admin") throw new HttpError(403, "forbidden");

    const { error } = await db.auth.admin.deleteUser(body.id);
    if (error) throw error;
    await db.from("admin_log").insert({ admin_id: user.id, action: "delete_student", detail: "Account and linked data deleted from the dashboard" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
