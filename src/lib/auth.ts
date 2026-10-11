import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  // getClaims checks the signed token locally, so it skips a network round trip to Supabase on every request.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const user = claims?.sub
    ? { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined }
    : null;
  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getCurrentUser();
  if (!user) throw new HttpError(401, "unauthorized");
  return { supabase, user };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") throw new HttpError(403, "forbidden");
  return { supabase, user };
}

export async function requireUserPage() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireAdminPage() {
  const { supabase, user } = await requireUserPage();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") redirect("/");
  return { supabase, user };
}
