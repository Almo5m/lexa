import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/features/demo/limits";
import { authorLabel, cleanHook, HOOKS_PER_DAY, isValidHook } from "@/features/hooks/hooks";

const bodySchema = z.object({
  wordId: z.string().uuid(),
  /** Empty text removes his hook. */
  hook: z.string().max(400),
  share: z.boolean().optional(),
  credit: z.enum(["name", "nick", "anon"]).optional(),
});

/**
 * The student writes his own memory hook for one of his words. It is kept on his word (and replaces the AI hook for him).
 * With `share` it also goes to the admin; if approved it shows to every student with his name, as he chose.
 */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) throw new HttpError(403, "forbidden");
    const { supabase, user } = await requireUser();
    const body = bodySchema.parse(await request.json());
    const hook = cleanHook(body.hook);

    const { data: word } = await supabase.from("words").select("id, term").eq("id", body.wordId).eq("user_id", user.id).maybeSingle();
    if (!word) throw new HttpError(404, "not_found");

    if (hook === "") {
      const { error } = await supabase.from("words").update({ my_hook: null }).eq("id", word.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, hook: null, status: null });
    }
    if (!isValidHook(hook)) throw new HttpError(400, "bad_hook");

    const db = createSupabaseAdminClient();
    if (body.share) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const recent = await db.from("shared_hooks").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
      if ((recent.count ?? 0) >= HOOKS_PER_DAY) throw new HttpError(429, "rate_limited");
    }

    const { error: saveError } = await supabase.from("words").update({ my_hook: hook }).eq("id", word.id);
    if (saveError) throw saveError;
    if (!body.share) return NextResponse.json({ ok: true, hook, status: null });

    const [{ data: profile }, { data: member }] = await Promise.all([
      db.from("profiles").select("display_name").eq("id", user.id).single(),
      db.from("board_members").select("nickname").eq("user_id", user.id).maybeSingle(),
    ]);
    const author = authorLabel(body.credit ?? "name", profile?.display_name ?? "", member?.nickname ?? null);
    const { error } = await db
      .from("shared_hooks")
      .upsert({ user_id: user.id, term: word.term.toLowerCase(), hook, author_name: author, status: "pending", created_at: new Date().toISOString() }, { onConflict: "user_id,term" });
    if (error) throw error;
    return NextResponse.json({ ok: true, hook, status: "pending" });
  } catch (error) {
    return handleApiError(error);
  }
}
