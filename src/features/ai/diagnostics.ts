import { classifyAiError, readableAiMessage, type AiErrorKind } from "./errors";
import { getClient } from "./gemini";

export interface ModelTestResult {
  model: string;
  ok: boolean;
  ms: number;
  kind?: AiErrorKind;
  message?: string;
}

const TEST_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("deadline: no answer in time")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** One tiny request per model, so the admin can see exactly what Google answers. */
export async function testModel(model: string): Promise<ModelTestResult> {
  const startedAt = Date.now();
  try {
    const response = await withTimeout(
      getClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }],
        config: { temperature: 0 },
      }),
      TEST_TIMEOUT_MS,
    );
    if (!(response.text ?? "").trim()) throw new Error("empty_response");
    return { model, ok: true, ms: Date.now() - startedAt };
  } catch (error) {
    return {
      model,
      ok: false,
      ms: Date.now() - startedAt,
      kind: classifyAiError(error),
      message: readableAiMessage(error).slice(0, 300),
    };
  }
}

const NOT_FOR_TEXT = /embedding|imagen|veo|tts|live|audio|image|robotics|computer-use|aqa|gemma|learnlm/i;
const MAX_MODELS = 40;

/** The text models this key can call right now, newest names first. */
export async function listUsableModels(): Promise<string[]> {
  const pager = await withTimeout(getClient().models.list({ config: { pageSize: 100, queryBase: true } }), TEST_TIMEOUT_MS);
  const names: string[] = [];
  for await (const model of pager) {
    const raw = model.name ?? "";
    const name = raw.replace(/^models\//, "");
    const actions = model.supportedActions ?? [];
    if (!name.startsWith("gemini") || NOT_FOR_TEXT.test(name)) continue;
    if (actions.length > 0 && !actions.includes("generateContent")) continue;
    names.push(name);
    if (names.length >= MAX_MODELS) break;
  }
  return names.sort((a, b) => b.localeCompare(a));
}
