import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasPlus } from "@/features/plus/server";

/** Quotes a cell, and stops a spreadsheet from running a cell that starts with = + - or @. */
function cell(value: unknown): string {
  let text = String(value ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Plus: the student's own words as a CSV file he can open in Excel or import into Anki. */
export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    if (!(await hasPlus(createSupabaseAdminClient(), user.id))) return NextResponse.json({ error: "plus_required" }, { status: 402 });

    const { data, error } = await supabase.from("words").select("term, meaning_ar, example_en, example_ar, created_at").eq("user_id", user.id).order("created_at").limit(20000);
    if (error) throw error;
    const lines = [["word", "meaning", "example", "example_translation"].join(",")];
    for (const row of data ?? []) lines.push([row.term, row.meaning_ar, row.example_en, row.example_ar].map(cell).join(","));
    return new NextResponse("﻿" + lines.join("\r\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="my-words.csv"', "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
