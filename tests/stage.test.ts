import { describe, expect, it } from "vitest";
import { chosenStage, hasBook, isUnitStage, unitFits } from "@/features/stage/stage";

describe("stage", () => {
  it("knows who chose", () => {
    expect(chosenStage("sec2")).toBe("sec2");
    expect(chosenStage("secondary")).toBeNull();
    expect(chosenStage(undefined)).toBeNull();
  });
  it("gives the book to third secondary and to accounts that never chose", () => {
    expect(hasBook("sec3")).toBe(true);
    expect(hasBook("secondary")).toBe(true);
    expect(hasBook("sec1")).toBe(false);
    expect(hasBook("general")).toBe(false);
  });
  it("filters units by stage", () => {
    expect(unitFits("sec3", "sec3")).toBe(true);
    expect(unitFits("sec3", "sec1")).toBe(false);
    expect(unitFits("all", "general")).toBe(true);
    expect(unitFits("sec1", "secondary")).toBe(true);
    expect(unitFits(null, "sec2")).toBe(true);
  });
  it("validates unit stages", () => {
    expect(isUnitStage("all")).toBe(true);
    expect(isUnitStage("sec4")).toBe(false);
  });
});
