"use client";

import { useRef, useState } from "react";
import { LessonText } from "@/components/lesson-text";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import { LESSON_COLORS, MAX_BODY_CHARS } from "@/features/grammar/markup";
import type { DictKey } from "@/lib/i18n/dictionary";

interface Snippet {
  label: DictKey;
  /** the caret mark (‸) is where the cursor goes; text selected before clicking is placed there. */
  text: string;
  /** The snippet starts on its own line. */
  block?: boolean;
}

const SNIPPETS: Snippet[] = [
  { label: "lessonEditor.h2", text: "## ‸", block: true },
  { label: "lessonEditor.h3", text: "### ‸", block: true },
  { label: "lessonEditor.bold", text: "**‸**" },
  { label: "lessonEditor.italic", text: "*‸*" },
  { label: "lessonEditor.highlight", text: "==‸==" },
  { label: "lessonEditor.bullets", text: "- ‸\n- ", block: true },
  { label: "lessonEditor.numbers", text: "1. ‸\n2. ", block: true },
  { label: "lessonEditor.table", text: "| Subject | Verb | Example |\n| --- | --- | --- |\n| I / you / we / they | have | |\n| he / she / it | has | |", block: true },
  { label: "lessonEditor.rule", text: ":::rule ‸\n\n:::", block: true },
  { label: "lessonEditor.tip", text: ":::tip ‸\n\n:::", block: true },
  { label: "lessonEditor.warn", text: ":::warn ‸\n\n:::", block: true },
  { label: "lessonEditor.example", text: ":::example ‸\n> \n:::", block: true },
  { label: "lessonEditor.quote", text: "> ‸", block: true },
  { label: "lessonEditor.divider", text: "---", block: true },
];

/** Write a lesson text with buttons for every style and a live preview of what the student will see. */
export function LessonEditor({ initial, busy, onSave, onCancel }: { initial: string; busy: boolean; onSave: (body: string) => void; onCancel: () => void }) {
  const { t } = useT();
  const area = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(initial);
  const [tab, setTab] = useState<"write" | "preview">("write");

  function insert(snippet: string, block = false) {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = body.slice(start, end);
    const lead = block && start > 0 && body[start - 1] !== "\n" ? "\n" : "";
    const cursor = snippet.indexOf("‸");
    const filled = cursor === -1 ? snippet : snippet.slice(0, cursor) + selected + snippet.slice(cursor + 1);
    const next = body.slice(0, start) + lead + filled + body.slice(end);
    setBody(next);
    const position = start + lead.length + (cursor === -1 ? filled.length : cursor + selected.length);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(position, position);
    });
  }

  const tooLong = body.length > MAX_BODY_CHARS;

  return (
    <div className="space-y-3 rounded-2xl border border-line p-3">
      <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label={t("lessonEditor.toolbar")}>
        {SNIPPETS.map((item) => (
          <button key={item.label} type="button" onClick={() => insert(item.text, item.block)} className="min-h-9 rounded-full px-3 text-sm shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep">
            {t(item.label)}
          </button>
        ))}
        <select
          className="field min-h-9 w-auto py-0 text-sm"
          aria-label={t("lessonEditor.color")}
          value=""
          onChange={(event) => {
            if (event.target.value) insert(`{${event.target.value}|‸}`);
            event.target.value = "";
          }}
        >
          <option value="">{t("lessonEditor.color")}</option>
          {LESSON_COLORS.map((color) => (
            <option key={color} value={color}>{t(`lessonEditor.color.${color}` as DictKey)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 lg:hidden" role="tablist">
        {(["write", "preview"] as const).map((item) => (
          <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`min-h-10 rounded-full px-4 text-sm ${tab === item ? "bg-ink font-medium text-sheet" : "shadow-[inset_0_0_0_2px_var(--color-line)]"}`}>
            {t(item === "write" ? "lessonEditor.write" : "lessonEditor.preview")}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={tab === "preview" ? "hidden lg:block" : ""}>
          <label htmlFor="lesson-body" className="sr-only">{t("lessonEditor.write")}</label>
          <textarea id="lesson-body" ref={area} value={body} onChange={(event) => setBody(event.target.value)} rows={16} dir="auto" spellCheck={false} className="field min-h-72 w-full resize-y font-mono text-sm leading-7" />
          <p className={`mt-1 text-xs ${tooLong ? "text-pen-red" : "text-ink-faint"}`}>{body.length} / {MAX_BODY_CHARS}</p>
        </div>
        <div className={`min-h-72 rounded-2xl bg-paper p-4 ${tab === "write" ? "hidden lg:block" : ""}`} aria-label={t("lessonEditor.preview")}>
          {body.trim() ? <LessonText body={body} /> : <p className="text-ink-faint">{t("lessonEditor.previewEmpty")}</p>}
        </div>
      </div>

      <details className="rounded-2xl bg-paper-deep p-3 text-sm">
        <summary className="min-h-9 cursor-pointer font-semibold">{t("lessonEditor.helpTitle")}</summary>
        <pre dir="ltr" className="mt-2 overflow-x-auto text-start text-xs leading-6">{HELP}</pre>
      </details>

      <div className="flex flex-wrap gap-2">
        <TagButton disabled={busy || body.trim() === "" || tooLong} onClick={() => onSave(body)}>{t("school.admin.saveWord")}</TagButton>
        <TagButton quiet onClick={onCancel}>{t("common.cancel")}</TagButton>
      </div>
    </div>
  );
}

const HELP = `## Section title          ### Small title
**bold**   *italic*   ==highlight==   ~~crossed~~   \`code\`
{red|coloured}  (red green blue orange purple gray)
- bullet            1. numbered     (2 spaces before - to nest)
> quote or example sentence
| A | B |           a table: the 2nd line is | --- | --- |
| --- | --- |
| x | y |
:::rule Title       boxes: rule  tip  warn  example  note
text inside
:::
---                 divider line
\\*  shows a symbol as it is`;
