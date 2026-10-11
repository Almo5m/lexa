/**
 * Tiny, safe parser for the light formatting Lexa's replies use.
 * It never produces HTML: it returns plain data that React renders as text.
 */
export type Inline = { kind: "text" | "bold" | "italic"; text: string };

export type Block =
  | { kind: "paragraph"; inlines: Inline[] }
  | { kind: "bullets"; items: Inline[][] }
  | { kind: "numbers"; items: Inline[][] };

const INLINE = /\*\*(.+?)\*\*|__(.+?)__|\*(?!\s)(.+?)\*/g;

export function parseInline(raw: string): Inline[] {
  const source = raw.replace(/`/g, "");
  const out: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ kind: "text", text: source.slice(last, index) });
    if (match[1] !== undefined) out.push({ kind: "bold", text: match[1] });
    else if (match[2] !== undefined) out.push({ kind: "bold", text: match[2] });
    else out.push({ kind: "italic", text: match[3] });
    last = index + match[0].length;
  }
  if (last < source.length) out.push({ kind: "text", text: source.slice(last) });
  // Stray unmatched markers should never reach the student's eyes.
  return out.map((part) => ({ ...part, text: part.text.replace(/\*\*|__/g, "") })).filter((p) => p.text !== "");
}

export function parseRichText(raw: string): Block[] {
  const blocks: Block[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const text = line.trim();
    if (!text) continue;
    const bullet = text.match(/^(?:[-*•])\s+(.+)$/);
    const number = text.match(/^\d+[.)]\s+(.+)$/);
    const heading = text.match(/^#{1,6}\s+(.+)$/);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.kind === "bullets") last.items.push(parseInline(bullet[1]));
      else blocks.push({ kind: "bullets", items: [parseInline(bullet[1])] });
    } else if (number) {
      if (last?.kind === "numbers") last.items.push(parseInline(number[1]));
      else blocks.push({ kind: "numbers", items: [parseInline(number[1])] });
    } else if (heading) {
      blocks.push({ kind: "paragraph", inlines: [{ kind: "bold", text: heading[1].replace(/\*\*/g, "") }] });
    } else {
      blocks.push({ kind: "paragraph", inlines: parseInline(text) });
    }
  }
  return blocks;
}

/** Splits text into Arabic and Latin runs so English words keep their direction inside Arabic lines. */
export function splitLatinRuns(text: string): { latin: boolean; text: string }[] {
  const runs: { latin: boolean; text: string }[] = [];
  for (const part of text.split(/([A-Za-z][A-Za-z0-9'’\- ,.!?;:()]*[A-Za-z0-9.!?)]|[A-Za-z])/g)) {
    if (!part) continue;
    runs.push({ latin: /^[A-Za-z]/.test(part), text: part });
  }
  return runs;
}
