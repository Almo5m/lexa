import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, HttpError } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { loadSettings } from "@/lib/settings-server";
import { assertWithinDailyLimit, callGeminiJson } from "@/features/ai/gemini";
import { WRITING_GRADE_SYSTEM } from "@/features/ai/prompts";
import { writingGradeSchema, totalMarks } from "@/features/writing/schemas";
import { saveBookScore } from "@/features/book/save";
import { countWords, writingTask } from "@/features/writing/tasks";

export const maxDuration = 60;

const bodySchema = z.object({
  taskId: z.string().max(40),
  text: z.string().trim().min(1).max(2500),
});

/** The task is looked up here by id, so the student can never change the brief the marks are based on. */
export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const settings = await loadSettings();
    const body = bodySchema.parse(await request.json());
    const task = writingTask(body.taskId);
    if (!task) throw new HttpError(404, "task_not_found");

    const words = countWords(body.text);
    if (words < task.minWords) throw new HttpError(400, "text_too_short");
    if (words > task.maxWords * 2) throw new HttpError(400, "text_too_long");

    await assertWithinDailyLimit(user.id, settings.aiDailyLimitPerStudent);
    const grade = await callGeminiJson(
      {
        userId: user.id,
        feature: "writing",
        model: settings.aiModel,
        fallbackModel: settings.aiFallbackModel,
        system: WRITING_GRADE_SYSTEM,
        prompt: [`Task: ${task.titleEn}`, `Brief: ${task.brief}`, `Word count: ${words}`, "Student text:", body.text].join("\n"),
        temperature: 0.2,
      },
      writingGradeSchema,
    );
    const total = totalMarks(grade);
    // The mark is only a bonus for the progress bar, so a saving problem never hides the feedback.
    await saveBookScore(user.id, task.id, "writing", total, 20).catch((error) => console.error(error));
    return NextResponse.json({ ...grade, total, words });
  } catch (error) {
    return handleApiError(error);
  }
}
