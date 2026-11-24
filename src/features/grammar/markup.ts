/**
 * The lesson text format the admin writes in. A small, safe subset of Markdown plus a few lesson-specific boxes.
 * It never produces HTML: the parser returns plain data and the page draws it with React, so nothing a writer types can run code.
 *
 *   # Title   ## Section   ### Small heading
 *   **bold**  *italic*  ==highlight==  ~~crossed~~  `code`  {red|coloured text}   (red green blue orange purple gray)
 *   - bullet   1. numbered   (two spaces before the dash for a nested list)
 *   > quote or example line
 *   | a | b |   a table: the second line is | --- | --- |
 *   :::rule Title ... :::   boxes: rule, tip, warn, example, note
 *   ---   a divider        ```  a code block ```
 *   \* a backslash shows the next symbol as it is
 */
export type Inline =
  | { k: "text"; v: string }
  | { k: "b" | "i" | "hl" | "s" | "code"; c: Inline[] }
  | { k: "color"; color: LessonColor; c: Inline[] };

export const LESSON_COLORS = ["red", "green", "blue", "orange", "purple", "gray"] as const;
export type LessonColor = (typeof LESSON_COLORS)[number];

export const CALLOUTS = ["rule", "tip", "warn", "example", "note"] as const;
export type CalloutKind = (typeof CALLOUTS)[number];

export interface ListItem {
  c: Inline[];
  children: ListNode | null;
}
export interface ListNode {
  t: "list";
  ordered: boolean;
  items: ListItem[];
}

export type Block =
  | { t: "h"; level: 1 | 2 | 3; c: Inline[] }
  | { t: "p"; lines: Inline[][] }
  | ListNode
  | { t: "table"; head: Inline[][]; rows: Inline[][][] }
  | { t: "quote"; lines: Inline[][] }
  | { t: "callout"; kind: CalloutKind; title: Inline[]; blocks: Block[] }
  | { t: "code"; text: string }
  | { t: "hr" };

export const MAX_BODY_CHARS = 20000;
const MAX_DEPTH = 6;

const MARKS: { open: string; kind: "b" | "hl" | "s" | "code" | "i" }[] = [
  { open: "**", kind: "b" },
  { open: "==", kind: "hl" },
  { open: "~~", kind: "s" },
  { open: "`", kind: "code" },
  { open: "*", kind: "i" },
];

export function parseInline(source: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) out.push({ k: "text", v: buffer });
    buffer = "";
  };
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === "\\" && i + 1 < source.length) {
      buffer += source[i + 1];
      i += 2;
      continue;
    }
    if (depth < MAX_DEPTH) {
      if (char === "{") {
        const match = /^\{(red|green|blue|orange|purple|gray)\|([^{}]+)\}/.exec(source.slice(i));
        if (match) {
          flush();
          out.push({ k: "color", color: match[1] as LessonColor, c: parseInline(match[2], depth + 1) });
          i += match[0].length;
          continue;
        }
      }
      const mark = MARKS.find((item) => source.startsWith(item.open, i));
      // Like Markdown: a mark opens before a letter and closes after one, so "2 * 3" stays plain text.
      if (mark && !/\s/.test(source[i + mark.open.length] ?? " ")) {
        let end = source.indexOf(mark.open, i + mark.open.length);
        while (end !== -1 && /\s/.test(source[end - 1] ?? "")) end = source.indexOf(mark.open, end + 1);
        if (end > i + mark.open.length) {
          const inner = source.slice(i + mark.open.length, end);
          flush();
          // Code is shown exactly as written.
          out.push(mark.kind === "code" ? { k: "code", c: [{ k: "text", v: inner }] } : { k: mark.kind, c: parseInline(inner, depth + 1) });
          i = end + mark.open.length;
          continue;
        }
      }
    }
    buffer += char;
    i += 1;
  }
  flush();
  return out;
}

const LIST_LINE = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim());
}

function isSpecialStart(line: string, next: string | undefined): boolean {
  return (
    /^#{1,3}\s/.test(line) ||
    /^\s*(-{3,}|\*{3,})\s*$/.test(line) ||
    line.startsWith(":::") ||
    line.startsWith("```") ||
    /^\s*>/.test(line) ||
    LIST_LINE.test(line) ||
    (line.includes("|") && next !== undefined && TABLE_SEPARATOR.test(next) && next.includes("-"))
  );
}

function parseList(lines: string[], start: number): { node: ListNode; next: number } {
  const first = LIST_LINE.exec(lines[start]) as RegExpExecArray;
  const baseIndent = first[1].length;
  const node: ListNode = { t: "list", ordered: /\d/.test(first[2]), items: [] };
  let i = start;
  while (i < lines.length) {
    const match = LIST_LINE.exec(lines[i]);
    if (!match) break;
    const indent = match[1].length;
    if (indent < baseIndent) break;
    if (indent >= baseIndent + 2) {
      // A nested list belongs to the last item.
      const nested = parseList(lines, i);
      const last = node.items[node.items.length - 1];
      if (last) last.children = nested.node;
      i = nested.next;
      continue;
    }
    node.items.push({ c: parseInline(match[3]), children: null });
    i += 1;
  }
  return { node, next: i };
}

export function parseBlocks(source: string, depth = 0): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i += 1;
      blocks.push({ t: "code", text: body.join("\n") });
      continue;
    }

    const callout = /^:::\s*(rule|tip|warn|example|note)\s*(.*)$/.exec(line);
    if (callout && depth < 1) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== ":::") body.push(lines[i++]);
      i += 1;
      blocks.push({ t: "callout", kind: callout[1] as CalloutKind, title: parseInline(callout[2].trim()), blocks: parseBlocks(body.join("\n"), depth + 1) });
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ t: "h", level: heading[1].length as 1 | 2 | 3, c: parseInline(heading[2].trim()) });
      i += 1;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ t: "hr" });
      i += 1;
      continue;
    }

    if (line.includes("|") && next !== undefined && TABLE_SEPARATOR.test(next) && next.includes("-")) {
      const head = splitRow(line).map((cell) => parseInline(cell));
      const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") rows.push(splitRow(lines[i++]).map((cell) => parseInline(cell)));
      blocks.push({ t: "table", head, rows });
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoted: Inline[][] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quoted.push(parseInline(lines[i++].replace(/^\s*>\s?/, "")));
      blocks.push({ t: "quote", lines: quoted });
      continue;
    }

    if (LIST_LINE.test(line)) {
      const { node, next: after } = parseList(lines, i);
      blocks.push(node);
      i = after;
      continue;
    }

    const paragraph: Inline[][] = [];
    while (i < lines.length && lines[i].trim() !== "" && !(paragraph.length > 0 && isSpecialStart(lines[i], lines[i + 1]))) {
      paragraph.push(parseInline(lines[i].trim()));
      i += 1;
    }
    blocks.push({ t: "p", lines: paragraph });
  }
  return blocks;
}
