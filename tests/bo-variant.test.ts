import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_BO_VARIANT, isBoVariant, readBoVariant, saveBoVariant } from "@/features/bo/variant";

function stubWindow(storage: Record<string, string> | "blocked") {
  const events: string[] = [];
  vi.stubGlobal("window", {
    localStorage:
      storage === "blocked"
        ? { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } }
        : { getItem: (key: string) => storage[key] ?? null, setItem: (key: string, value: string) => { storage[key] = value; } },
    dispatchEvent: (event: Event) => { events.push(event.type); return true; },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal("CustomEvent", class { constructor(public type: string) {} });
  return events;
}

afterEach(() => vi.unstubAllGlobals());

describe("Bo variant", () => {
  it("accepts only the two known variants", () => {
    expect(isBoVariant("flyer")).toBe(true);
    expect(isBoVariant("classic")).toBe(true);
    expect(isBoVariant("robot")).toBe(false);
    expect(isBoVariant(null)).toBe(false);
  });

  it("falls back to the default when nothing or junk is stored", () => {
    stubWindow({});
    expect(readBoVariant()).toBe(DEFAULT_BO_VARIANT);
    stubWindow({ "bo-variant-v1": "<script>" });
    expect(readBoVariant()).toBe(DEFAULT_BO_VARIANT);
  });

  it("saves the choice, reads it back and tells every Bo on screen", () => {
    const store: Record<string, string> = {};
    const events = stubWindow(store);
    saveBoVariant("classic");
    expect(readBoVariant()).toBe("classic");
    expect(events).toContain("bo-variant-change");
  });

  it("does not crash when storage is blocked", () => {
    stubWindow("blocked");
    expect(() => saveBoVariant("classic")).not.toThrow();
    expect(readBoVariant()).toBe(DEFAULT_BO_VARIANT);
  });
});
