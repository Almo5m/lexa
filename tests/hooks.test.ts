import { describe, expect, it } from "vitest";
import { authorLabel, cleanHook, isValidHook } from "@/features/hooks/hooks";

describe("hooks", () => {
  it("cleans markup and spaces", () => {
    expect(cleanHook("  <b>كلمة</b>   شبه   صوت ")).toBe("bكلمة/b شبه صوت");
    expect(cleanHook("a\n\nb")).toBe("a b");
  });
  it("checks length", () => {
    expect(isValidHook("ab")).toBe(false);
    expect(isValidHook("abc")).toBe(true);
    expect(isValidHook("x".repeat(150))).toBe(true);
    expect(isValidHook("x".repeat(151))).toBe(false);
  });
  it("credits as the student chose", () => {
    expect(authorLabel("name", "Ahmed Ali", "Blue Fox")).toBe("Ahmed");
    expect(authorLabel("nick", "Ahmed Ali", "Blue Fox")).toBe("Blue Fox");
    expect(authorLabel("nick", "Ahmed Ali", null)).toBe("Ahmed");
    expect(authorLabel("anon", "Ahmed Ali", "Blue Fox")).toBe("");
  });
});
