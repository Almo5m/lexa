import { describe, expect, it } from "vitest";
import { pickMode } from "@/features/srs/session";

describe("pickMode", () => {
  it("starts new words with a typed word exercise, never a self-grade", () => {
    expect(pickMode({ status: "new", repetitions: 0, lapses: 0 })).toBe("write");
  });
  it("makes weak words typed exercises, alternating write and listen", () => {
    expect(pickMode({ status: "weak", repetitions: 0, lapses: 4 })).toBe("write");
    expect(pickMode({ status: "weak", repetitions: 0, lapses: 3 })).toBe("listen");
  });
  it("rotates write, listen and sentence for learning words", () => {
    const seen = new Set([0, 1, 2].map((n) => pickMode({ status: "learning", repetitions: n, lapses: 0 })));
    expect(seen).toEqual(new Set(["write", "listen", "sentence"]));
  });
});
