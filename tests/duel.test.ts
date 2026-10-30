import { describe, expect, it } from "vitest";
import { isDuelCode, makeDuelCode } from "@/features/duel/code";

describe("duel codes", () => {
  it("makes valid six character codes", () => {
    for (let i = 0; i < 200; i++) expect(isDuelCode(makeDuelCode())).toBe(true);
  });
  it("rejects bad codes", () => {
    for (const bad of ["", "ABC", "abcdef", "ABCDEF1", "ABCD0F", "ABCDIL", "AB CDE"]) expect(isDuelCode(bad)).toBe(false);
  });
});
