import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { testModel } from "@/features/ai/diagnostics";

export const maxDuration = 60;

interface Check {
  id: "gemini" | "service" | "settings" | "usage";
  ok: boolean;
  message?: string;
}

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [
    { id: "gemini", ok: Boolean(process.env.GEMINI_API_KEY) },
    { id: "service", ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
  ];
  if (!checks[1].ok) return checks;

  const db = createSupabaseAdminClient();
  const settingsRead = await db.from("app_settings").select("id").limit(1);
  checks.push({ id: "settings", ok: !settingsRead.error, message: settingsRead.error?.message });

  // Writing a row with the newest feature name also proves the phase 2 migration was run.
  const written = await db
    .from("ai_usage")
    .insert({ user_id: null, feature: "translate", ok: true, latency_ms: 0, error: "admin check" })
    .select("id")
    .single();
  if (written.error) {
    checks.push({ id: "usage", ok: false, message: written.error.message });
  } else {
    await db.from("ai_usage").delete().eq("id", written.data.id);
    checks.push({ id: "usage", ok: true });
  }
  return checks;
}

export async function POST() {
  try {
    await requireAdmin();
    const checks = await runChecks();
    const keySet = checks[0].ok;
    if (!keySet) return NextResponse.json({ keySet, checks, results: [] });

    const settings = await loadSettings();
    const names = [...new Set([settings.aiModel, settings.aiFallbackModel].filter(Boolean))];
    const results = await Promise.all(names.map((name) => testModel(name)));
    return NextResponse.json({
      keySet,
      checks,
      results: results.map((result) => ({
        ...result,
        role: result.model === settings.aiModel ? "main" : "fallback",
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
