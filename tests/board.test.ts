import { describe, expect, it } from "vitest";
import { ADJECTIVES, ANIMALS, isValidNickname, makeNickname } from "@/features/board/nickname";
import { daysUntilReset, weekStartKey } from "@/features/board/week";

describe("nicknames", () => {
  it("makes names the server accepts", () => {
    for (let i = 0; i < 200; i++) expect(isValidNickname(makeNickname())).toBe(true);
    expect(makeNickname(() => 0)).toBe(`${ANIMALS[0]} ${ADJECTIVES[0]} 10`);
  });
  it("refuses anything typed by hand", () => {
    expect(isValidNickname("أحمد حسن")).toBe(false);
    expect(isValidNickname(`${ANIMALS[0]} ${ADJECTIVES[0]} 05`)).toBe(false);
    expect(isValidNickname(`${ANIMALS[0]} bad 12`)).toBe(false);
    expect(isValidNickname("")).toBe(false);
  });
});

describe("week", () => {
  it("starts on Saturday", () => {
    expect(weekStartKey(new Date("2026-10-31T10:00:00Z"))).toBe("2026-10-31"); // Saturday
    expect(weekStartKey(new Date("2026-11-04T10:00:00Z"))).toBe("2026-10-31"); // Wednesday
    expect(weekStartKey(new Date("2026-11-06T10:00:00Z"))).toBe("2026-10-31"); // Friday
    expect(weekStartKey(new Date("2026-11-07T10:00:00Z"))).toBe("2026-11-07"); // next Saturday
  });
  it("counts the days until the reset", () => {
    expect(daysUntilReset(new Date("2026-10-31T10:00:00Z"))).toBe(7);
    expect(daysUntilReset(new Date("2026-11-06T10:00:00Z"))).toBe(1);
  });
});
