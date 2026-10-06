import { describe, expect, it } from "vitest";
import { pickMode } from "@/features/srs/session";

describe("pickMode", () => {
  it("introduces new words with recall", () => {
    expect(pickMode({ status: "new", repetitions: 0, lapses: 0 })).toBe("recall");
  });
  it("makes weak words typed exercises, alternating write and listen", () => {
    expect(pickMode({ status: "weak", repetitions: 0, lapses: 4 })).toBe("write");
    expect(pickMode({ status: "weak", repetitions: 0, lapses: 3 })).toBe("listen");
  });
  it("rotates modes for learning and mastered words so exercises do not repeat", () => {
    const seen = new Set([0, 1, 2].map((n) => pickMode({ status: "learning", repetitions: n, lapses: 0 })));
    expect(seen.size).toBe(3);
  });
});
