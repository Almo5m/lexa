import { describe, expect, it } from "vitest";
import { basicCard } from "@/features/curriculum/basic-card";
import { cardSchema } from "@/features/ai/schemas";
import { PATH } from "@/features/curriculum";

describe("basicCard", () => {
  it("builds a card the app accepts for every path word", () => {
    for (const entry of PATH) {
      const parsed = cardSchema.safeParse(basicCard(entry));
      expect(parsed.success, entry.en).toBe(true);
    }
  });

  it("splits the Arabic meanings and capitalizes the phrase", () => {
    const card = basicCard({ en: "uncle", pos: "noun", ar: "عم، خال", chunkEn: "my uncle lives in Alexandria", chunkAr: "x" });
    expect(card.meaningsAr).toEqual(["عم", "خال"]);
    expect(card.sentence).toBe("My uncle lives in Alexandria.");
  });
});
