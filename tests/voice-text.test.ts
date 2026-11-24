import { describe, expect, it } from "vitest";
import { cleanForSpeech, segmentByScript, speechMatch, splitSentences } from "@/lib/voice/text";

describe("cleanForSpeech", () => {
  it("drops markdown marks and links", () => {
    expect(cleanForSpeech("## Title\n**Bold** and `code` [site](https://x.com)\n- item")).toBe("Title Bold and code site item");
  });
  it("drops code blocks, urls and emoji", () => {
    expect(cleanForSpeech("Hi 😀 ```a=1``` see https://x.com now")).toBe("Hi see now");
  });
});

describe("splitSentences", () => {
  it("splits on sentence ends", () => {
    expect(splitSentences("Hello there. How are you? Fine!")).toEqual(["Hello there.", "How are you?", "Fine!"]);
  });
  it("cuts a very long sentence by words under the limit", () => {
    const long = Array(60).fill("word").join(" ");
    const parts = splitSentences(long, 50);
    expect(parts.every((part) => part.length <= 50)).toBe(true);
    expect(parts.join(" ")).toBe(long);
  });
  it("handles Arabic question marks", () => {
    expect(splitSentences("إزيك؟ أنا تمام.")).toEqual(["إزيك؟", "أنا تمام."]);
  });
});

describe("segmentByScript", () => {
  it("tags each sentence with its language", () => {
    expect(segmentByScript("Say **hello**. يعني أهلاً.")).toEqual([
      { lang: "en", text: "Say hello." },
      { lang: "ar", text: "يعني أهلاً." },
    ]);
  });
  it("skips sentences with no letters", () => {
    expect(segmentByScript("123. ...")).toEqual([]);
  });
});

describe("speechMatch", () => {
  it("is 1 for the same sentence ignoring case and punctuation", () => {
    expect(speechMatch("I have lived here.", "i have lived here")).toBe(1);
  });
  it("counts words in order", () => {
    expect(speechMatch("I have lived here", "I lived here")).toBe(0.75);
  });
  it("is 0 for nothing heard or an empty target", () => {
    expect(speechMatch("hello", "")).toBe(0);
    expect(speechMatch("", "hello")).toBe(0);
  });
});
