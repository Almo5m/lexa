import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionary";
import { COLORS, HATS } from "@/features/bo/look";
import { LEVELS, SORTS, SOURCES } from "@/features/words/bubbles";
import { STAGES, UNIT_STAGES } from "@/features/stage/stage";

/**
 * Keys built at run time (`t(`look.hat.${id}`)`) are not checked by TypeScript, and a missing one crashes the whole page.
 * Each family is listed from the code that owns the ids, so adding an id without its text fails here.
 */
const families: Record<string, string[]> = {
  "look.hat.": HATS.map((hat) => hat.id),
  "look.color.": COLORS.map((color) => color.id),
  "stage.": [...STAGES],
  "school.admin.stage.": [...UNIT_STAGES, "every"],
  "plus.feature.": ["ai", "export", "look", "chat"],
  "level.skills.": ["en2ar", "ar2en", "word", "write"],
  "hook.status.": ["pending", "approved", "rejected"],
  "hooks.status.": ["pending", "approved", "rejected"],
  "mastery.": [...LEVELS],
  "source.": [...SOURCES],
  "sort.": [...SORTS],
  "plans.name.": ["free", "plus"],
  "plans.state.": ["active", "expiring", "expired"],
  "level.name.": ["1", "2", "3", "4", "5"],
};

function settingsKeys(): string[] {
  const source = readFileSync("src/components/admin-settings-form.tsx", "utf8");
  return [...source.matchAll(/key: "([a-zA-Z]+)"/g)].map((match) => match[1]);
}

describe("dynamic dictionary keys", () => {
  for (const lang of ["ar", "en"] as const) {
    const dict = dictionaries[lang] as Record<string, string>;
    it(`${lang}: every id has its text`, () => {
      const missing: string[] = [];
      for (const [prefix, ids] of Object.entries(families)) for (const id of ids) if (!dict[prefix + id]) missing.push(prefix + id);
      for (const key of settingsKeys()) {
        if (!dict[`admin.field.${key}`]) missing.push(`admin.field.${key}`);
      }
      expect(missing).toEqual([]);
    });
  }
});
