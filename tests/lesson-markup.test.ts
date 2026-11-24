import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline, type Block, type Inline } from "@/features/grammar/markup";

const text = (nodes: Inline[]): string => nodes.map((n) => (n.k === "text" ? n.v : text(n.c))).join("");

describe("inline", () => {
  it("bold, italic, highlight, strike, code, colour", () => {
    const nodes = parseInline("a **b** *c* ==d== ~~e~~ `f` {red|g}");
    expect(nodes.map((n) => n.k)).toEqual(["text", "b", "text", "i", "text", "hl", "text", "s", "text", "code", "text", "color"]);
  });
  it("nests marks", () => {
    const [node] = parseInline("**bold and {red|red}**");
    expect(node.k).toBe("b");
    expect(text([node])).toBe("bold and red");
  });
  it("code is not parsed", () => expect(text(parseInline("`**x**`"))).toBe("**x**"));
  it("unclosed marks stay as text", () => expect(parseInline("2 * 3 and **open")).toEqual([{ k: "text", v: "2 * 3 and **open" }]));
  it("backslash escapes", () => expect(text(parseInline("\\*not italic\\*"))).toBe("*not italic*"));
  it("never makes HTML", () => {
    const nodes = parseInline("<script>alert(1)</script> <b>x</b>");
    expect(JSON.stringify(nodes)).toContain("<script>");
    expect(nodes.every((n) => n.k === "text")).toBe(true);
  });
  it("unknown colours stay text", () => expect(parseInline("{pink|x}")).toEqual([{ k: "text", v: "{pink|x}" }]));
});

describe("blocks", () => {
  const kinds = (blocks: Block[]) => blocks.map((b) => b.t);
  it("headings, paragraphs, divider", () => {
    expect(kinds(parseBlocks("# Title\n\nSome text\nsecond line\n\n---\n\n### Small"))).toEqual(["h", "p", "hr", "h"]);
    const p = parseBlocks("one\ntwo")[0];
    expect(p.t === "p" && p.lines.length).toBe(2);
  });
  it("bullets, numbers and nesting", () => {
    const [list] = parseBlocks("- a\n- b\n  - b1\n  - b2\n- c");
    expect(list.t).toBe("list");
    if (list.t === "list") {
      expect(list.items).toHaveLength(3);
      expect(list.items[1].children?.items).toHaveLength(2);
    }
    const [ordered] = parseBlocks("1. x\n2. y");
    expect(ordered.t === "list" && ordered.ordered).toBe(true);
  });
  it("tables", () => {
    const [table] = parseBlocks("| Subject | Verb |\n| --- | --- |\n| I | have |\n| She | has |");
    expect(table.t).toBe("table");
    if (table.t === "table") {
      expect(table.head).toHaveLength(2);
      expect(table.rows).toHaveLength(2);
      expect(text(table.rows[1][1])).toBe("has");
    }
  });
  it("a line with a bar but no separator is a paragraph", () => expect(kinds(parseBlocks("a | b"))).toEqual(["p"]));
  it("callout boxes hold blocks", () => {
    const [box] = parseBlocks(":::rule The rule\nUse **has** with she.\n- one\n:::\nafter");
    expect(box.t).toBe("callout");
    if (box.t === "callout") {
      expect(box.kind).toBe("rule");
      expect(text(box.title)).toBe("The rule");
      expect(kinds(box.blocks)).toEqual(["p", "list"]);
    }
  });
  it("quote and code", () => {
    expect(kinds(parseBlocks("> I have seen it.\n> She has gone."))).toEqual(["quote"]);
    const [code] = parseBlocks("```\nfoo **bar**\n```");
    expect(code.t === "code" && code.text).toBe("foo **bar**");
  });
  it("Arabic text works", () => {
    const [p] = parseBlocks("القاعدة: **has** مع he و she");
    expect(p.t).toBe("p");
  });
  it("survives odd input", () => {
    for (const bad of ["", ":::rule", "|", "| - |", "```", "#", "- ", "{red|", "**", ":::note\n:::note\nx\n:::\n:::"]) {
      expect(() => parseBlocks(bad)).not.toThrow();
    }
  });
});
