import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { publicEnv, serverEnv } from "@/lib/env";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe("environment variables", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("reads each variable by its full name", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    process.env.GEMINI_API_KEY = "gemini";
    expect(publicEnv.supabaseUrl()).toBe("https://x.supabase.co");
    expect(publicEnv.supabaseAnonKey()).toBe("anon");
    expect(serverEnv.supabaseServiceKey()).toBe("service");
    expect(serverEnv.geminiApiKey()).toBe("gemini");
  });

  it("names the missing variable in the error", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => serverEnv.geminiApiKey()).toThrow("Missing environment variable: GEMINI_API_KEY");
  });

  it("never looks variables up by a computed name, which breaks in the browser", () => {
    const offenders = sourceFiles(path.resolve(__dirname, "../src")).filter((file) =>
      /process\.env\s*\[/.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
