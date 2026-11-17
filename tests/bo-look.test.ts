import { describe, expect, it } from "vitest";
import { DEFAULT_LOOK, clampLook, parseLook } from "@/features/bo/look";

describe("Bo look", () => {
  it("falls back on bad data", () => {
    expect(parseLook(null)).toEqual(DEFAULT_LOOK);
    expect(parseLook("{oops")).toEqual(DEFAULT_LOOK);
    expect(parseLook('{"hat":"laser","color":"mint"}')).toEqual(DEFAULT_LOOK);
  });
  it("keeps a valid look", () => {
    expect(parseLook('{"hat":"cap","color":"green"}')).toEqual({ hat: "cap", color: "green" });
  });
  it("drops pieces that are not unlocked", () => {
    expect(clampLook({ hat: "crown", color: "gold" }, 1)).toEqual(DEFAULT_LOOK);
    expect(clampLook({ hat: "crown", color: "gold" }, 8)).toEqual({ hat: "crown", color: "gold" });
    expect(clampLook({ hat: "cap", color: "gold" }, 3)).toEqual({ hat: "cap", color: "blue" });
  });
  it("keeps Plus pieces for Plus students only", () => {
    expect(clampLook({ hat: "wizard", color: "pink" }, 10, false)).toEqual(DEFAULT_LOOK);
    expect(clampLook({ hat: "wizard", color: "pink" }, 1, true)).toEqual({ hat: "wizard", color: "pink" });
  });
});
