import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth";
import { AiBusyError, AiDisabledError, AiLimitError, AiUnavailableError } from "@/features/ai/gemini";

export function handleApiError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof AiLimitError) {
    return NextResponse.json({ error: "daily_ai_limit_reached" }, { status: 429 });
  }
  if (error instanceof AiBusyError) {
    return NextResponse.json({ error: "ai_busy" }, { status: 503 });
  }
  if (error instanceof AiUnavailableError) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }
  if (error instanceof AiDisabledError) {
    return NextResponse.json({ error: "ai_feature_disabled" }, { status: 503 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
