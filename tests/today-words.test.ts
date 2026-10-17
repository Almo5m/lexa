import { describe, expect, it } from "vitest";
import { WORDS_TOPIC, wordsTopicPrompt } from "@/features/curriculum/today";
import { sentenceMentionsWord } from "@/features/srs/judge";

describe("speak step", () => {
  it("names the words in the prompt", () => {
    const prompt = wordsTopicPrompt(["mother", "bus", "tea"]);
    expect(prompt).toContain("mother, bus, tea");
    expect(prompt).toMatch(/at least two/);
  });

  it("uses a fixed topic id the server recognizes", () => {
    expect(WORDS_TOPIC).toBe("words");
  });

  it("counts which target words the student used, in common forms", () => {
    const text = "My mother drinks tea and we take the buses to school.";
    const used = ["mother", "bus", "tea", "uncle"].filter((word) => sentenceMentionsWord(text, word));
    expect(used).toEqual(["mother", "bus", "tea"]);
  });
});
