import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { normalizeWord } from "@/features/words/clean";

const bodySchema = z.object({
  words: z.array(z.string().max(60)).min(1).max(300),
  groupName: z.string().trim().min(1).max(60).optional(),
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = bodySchema.parse(await request.json());

    const terms = [...new Set(body.words.map(normalizeWord).filter((w): w is string => w !== null))];
    if (terms.length === 0) return NextResponse.json({ error: "no_valid_words" }, { status: 400 });

    let groupId: string | null = null;
    if (body.groupName) {
      const { data: group, error } = await supabase
        .from("word_groups")
        .upsert({ user_id: user.id, name: body.groupName }, { onConflict: "user_id,name" })
        .select("id")
        .single();
      if (error) throw error;
      groupId = group.id;
    }

    const { data: inserted, error } = await supabase
      .from("words")
      .upsert(
        terms.map((term) => ({ user_id: user.id, term, group_id: groupId })),
        { onConflict: "user_id,term", ignoreDuplicates: true },
      )
      .select("id");
    if (error) throw error;

    return NextResponse.json({ added: inserted?.length ?? 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
