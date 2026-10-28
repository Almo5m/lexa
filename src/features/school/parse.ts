import type { ParseProblem, ParsedWord } from "./types";

/** One import never holds more than this many words, so a wrong file can't flood the table. */
export const MAX_IMPORT_WORDS = 600;
export const MAX_IMPORT_CHARS = 120_000;

const TERM = /^[A-Za-z][A-Za-z '’-]{1,39}$/;

/**
 * Reads the admin's list. One word per line: `word | part of speech | Arabic meaning | example | Arabic example`.
 * The separator can be `|`, a tab (copied from a sheet) or a comma (CSV). Only the word and the meaning are required.
 * A first line that looks like a header (word, term, الكلمة) is skipped.
 */
export function parseWordLines(text: string): { words: ParsedWord[]; problems: ParseProblem[] } {
  const words: ParsedWord[] = [];
  const problems: ParseProblem[] = [];
  const seen = new Set<string>();
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);

  lines.forEach((raw, index) => {
    const line = index + 1;
    if (raw.trim() === "") return;
    const cells = splitCells(raw);
    if (index === 0 && isHeader(cells[0])) return;

    const [termRaw = "", posRaw = "", meaningRaw = "", exampleEn = "", exampleAr = ""] = cells;
    // Two columns only: `word | meaning`.
    const twoColumns = cells.length === 2;
    const term = termRaw.trim().toLowerCase().replace(/\s+/g, " ");
    const pos = twoColumns ? "" : posRaw.trim().toLowerCase();
    const meaningAr = (twoColumns ? posRaw : meaningRaw).trim();

    if (cells.length < 2) return void problems.push({ line, reason: "format" });
    if (!TERM.test(term)) return void problems.push({ line, reason: "term" });
    if (meaningAr === "") return void problems.push({ line, reason: "meaning" });
    const example = twoColumns ? "" : exampleEn.trim();
    const exampleArabic = twoColumns ? "" : exampleAr.trim();
    if (pos.length > 20 || meaningAr.length > 120 || example.length > 200 || exampleArabic.length > 200) {
      return void problems.push({ line, reason: "long" });
    }
    if (seen.has(term)) return void problems.push({ line, reason: "duplicate" });
    seen.add(term);
    words.push({ term, pos, meaningAr, exampleEn: example, exampleAr: exampleArabic });
  });

  return { words, problems };
}

function splitCells(line: string): string[] {
  if (line.includes("|")) return line.split("|").map((cell) => cell.trim());
  if (line.includes("\t")) return line.split("\t").map((cell) => cell.trim());
  return splitCsv(line);
}

/** A small CSV reader: commas separate cells, double quotes protect commas inside a cell. */
function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function isHeader(first: string | undefined): boolean {
  return ["word", "term", "words", "الكلمة", "كلمة"].includes((first ?? "").trim().toLowerCase());
}
