import { describe, expect, it } from "vitest";
import { parseInline, parseRichText } from "@/features/text/rich";

describe("rich text", () => {
  it("turns **word** into bold, never leaving asterisks", () => {
    const parts = parseInline("كلمة **ability** معناها قدرة");
    expect(parts.find((p) => p.kind === "bold")?.text).toBe("ability");
    expect(parts.map((p) => p.text).join("")).not.toContain("*");
  });
  it("drops unmatched markers", () => {
    expect(parseInline("hello ** world").map((p) => p.text).join("")).not.toContain("*");
  });
  it("groups lists", () => {
    const blocks = parseRichText("1. one\n2. two\n- a\n- b");
    expect(blocks.map((b) => b.kind)).toEqual(["numbers", "bullets"]);
  });
  it("turns headings into bold paragraphs", () => {
    const [block] = parseRichText("## Title");
    expect(block.kind).toBe("paragraph");
  });
});
