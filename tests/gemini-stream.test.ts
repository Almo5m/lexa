import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
let behavior: Record<string, () => AsyncGenerator<{ text: string }>> = {};

vi.mock("@google/genai", () => ({
  ThinkingLevel: { MINIMAL: "MINIMAL" },
  GoogleGenAI: class {
    models = {
      generateContentStream: async ({ model }: { model: string }) => {
        calls.push(model);
        const make = behavior[model];
        if (!make) throw new Error("no behavior for " + model);
        return make();
      },
    };
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ from: () => ({ insert: async () => ({}) }) }),
}));

process.env.GEMINI_API_KEY = "test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";

import { AiBusyError, streamGemini } from "@/features/ai/gemini";

const options = { userId: null, feature: "tutor" as const, model: "main", fallbackModel: "backup", system: "s", prompt: "p" };

async function collect(generator: AsyncGenerator<string>) {
  const parts: string[] = [];
  for await (const part of generator) parts.push(part);
  return parts;
}

async function* chunks(...texts: string[]) {
  for (const text of texts) yield { text };
}

beforeEach(() => {
  calls.length = 0;
  behavior = {};
});

describe("streamGemini", () => {
  it("gives the pieces in order as they arrive", async () => {
    behavior.main = () => chunks("Hel", "lo", "!");
    expect(await collect(streamGemini(options))).toEqual(["Hel", "lo", "!"]);
    expect(calls).toEqual(["main"]);
  });

  it("switches to the backup model when the first one is over quota before any text", async () => {
    behavior.main = () => {
      throw Object.assign(new Error("RESOURCE_EXHAUSTED 429 quota"), { status: 429 });
    };
    behavior.backup = () => chunks("ok");
    expect(await collect(streamGemini(options))).toEqual(["ok"]);
    expect(calls).toEqual(["main", "backup"]);
  });

  it("does not switch models after text was already sent, it ends with a clear error", async () => {
    behavior.main = async function* () {
      yield { text: "partial" };
      throw Object.assign(new Error("503 UNAVAILABLE overloaded"), { status: 503 });
    };
    behavior.backup = () => chunks("never");
    const seen: string[] = [];
    await expect(
      (async () => {
        for await (const part of streamGemini(options)) seen.push(part);
      })(),
    ).rejects.toBeInstanceOf(AiBusyError);
    expect(seen).toEqual(["partial"]);
    expect(calls).toEqual(["main"]);
  });
});
