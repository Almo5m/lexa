import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { listUsableModels } from "@/features/ai/diagnostics";
import { classifyAiError, readableAiMessage } from "@/features/ai/errors";

export const maxDuration = 60;

export async function GET() {
  try {
    await requireAdmin();
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ models: [], error: "no_key" });
    try {
      return NextResponse.json({ models: await listUsableModels() });
    } catch (error) {
      return NextResponse.json({
        models: [],
        error: classifyAiError(error),
        message: readableAiMessage(error).slice(0, 300),
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
