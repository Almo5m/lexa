// Writes every curriculum word to a CSV the teacher can open in Excel or Sheets and mark up.
// Run: npm run export:curriculum  ->  exports/curriculum-review.csv
import { stripTypeScriptTypes } from "node:module";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The curriculum files are plain data, so their types are stripped (Node 22.13+) one by one into a temp folder and imported from there.
const source = "src/features/curriculum";
const temp = mkdtempSync(join(tmpdir(), "lexa-curriculum-"));
for (const file of readdirSync(source).filter((name) => /^(index|types|a1|a2[a-z]|b1[a-z])\.ts$/.test(name))) {
  const outputText = stripTypeScriptTypes(readFileSync(join(source, file), "utf8"));
  writeFileSync(join(temp, file.replace(/\.ts$/, ".mjs")), outputText.replace(/from "\.\/(\w+)"/g, 'from "./$1.mjs"'));
}
const { UNITS } = await import(pathToFileURL(join(temp, "index.mjs")).href);
rmSync(temp, { recursive: true });

const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const header = ["level", "unit", "unit_title_ar", "unit_title_en", "word", "pos", "meaning_ar", "example_en", "example_ar", "teacher_ok (yes/no)", "teacher_correction"];
const rows = [header.map(cell).join(",")];
for (const unit of UNITS) {
  for (const word of unit.words) {
    rows.push([unit.level, unit.id, unit.titleAr, unit.titleEn, word.en, word.pos, word.ar, word.chunkEn, word.chunkAr, "", ""].map(cell).join(","));
  }
}
mkdirSync("exports", { recursive: true });
// The BOM makes Excel read the Arabic text as UTF-8.
writeFileSync("exports/curriculum-review.csv", `﻿${rows.join("\r\n")}\r\n`);
console.log(`${rows.length - 1} words in ${UNITS.length} units -> exports/curriculum-review.csv`);
