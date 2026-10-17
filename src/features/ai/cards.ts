import { cardBatchSchema } from "@/features/ai/schemas";
import { CARDS_SYSTEM } from "@/features/ai/prompts";
import { callGeminiJson } from "@/features/ai/gemini";

/** Meanings a teacher already wrote. When given, the AI keeps them so cards never contradict the path. */
export type MeaningHints = Record<string, string>;

export function requestCards(
  userId: string,
  model: string,
  fallbackModel: string,
  terms: string[],
  interestsLine: string,
  hints: MeaningHints = {},
) {
  const hintLines = terms
    .filter((term) => hints[term])
    .map((term) => `${term} = ${hints[term]}`)
    .join("\n");
  return callGeminiJson(
    {
      userId,
      feature: "cards",
      model,
      fallbackModel,
      system: CARDS_SYSTEM,
      prompt:
        `Write cards for these words: ${JSON.stringify(terms)}` +
        (hintLines ? `\nUse exactly these Arabic meanings first in meaningsAr:\n${hintLines}` : "") +
        (interestsLine ? `\n${interestsLine}` : ""),
      temperature: 0.8,
    },
    cardBatchSchema,
  );
}
