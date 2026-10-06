import { NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { extractionSchema } from "@/features/ai/schemas";
import { EXTRACT_SYSTEM } from "@/features/ai/prompts";
import {
  AiDisabledError,
  assertWithinDailyLimit,
  callGeminiJson,
  type InlineImage,
} from "@/features/ai/gemini";
import { cleanExtractedWords, splitAgainstLibrary } from "@/features/words/clean";

export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    const settings = await loadSettings();
    if (!settings.imageExtractionEnabled) throw new AiDisabledError();

    const form = await request.formData();
    const files = form.getAll("images").filter((item): item is File => item instanceof File);
    if (files.length === 0) throw new HttpError(400, "no_images");
    if (files.length > settings.maxImagesPerUpload) throw new HttpError(400, "too_many_images");

    const maxBytes = settings.maxImageSizeMb * 1024 * 1024;
    const images: InlineImage[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) throw new HttpError(400, "unsupported_image_type");
      if (file.size > maxBytes) throw new HttpError(400, "image_too_large");
      images.push({
        mimeType: file.type,
        base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      });
    }

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const result = await callGeminiJson(
      {
        userId: user.id,
        feature: "extract",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: EXTRACT_SYSTEM,
        prompt: "List the English vocabulary words in these images.",
        images,
        temperature: 0,
      },
      extractionSchema,
    );

    const cleaned = cleanExtractedWords(result.words);
    const { data: existing } = await supabase
      .from("words")
      .select("term")
      .in("term", cleaned.words);
    const { fresh, alreadyKnown } = splitAgainstLibrary(
      cleaned.words,
      (existing ?? []).map((row) => row.term),
    );

    return NextResponse.json({
      words: fresh,
      alreadyKnown,
      duplicates: cleaned.duplicates,
      rejected: cleaned.rejected,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
