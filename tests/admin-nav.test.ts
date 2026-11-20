import { describe, expect, it } from "vitest";
import { ADMIN_GROUPS, ADMIN_TABS, isAdminTab } from "@/features/admin/nav";
import { dictionaries } from "@/lib/i18n/dictionary";

describe("admin nav", () => {
  it("lists every tab once", () => {
    expect(new Set(ADMIN_TABS).size).toBe(ADMIN_TABS.length);
    expect(isAdminTab("hooks")).toBe(true);
    expect(isAdminTab("nope")).toBe(false);
  });
  it("has a name and a description for every tab, and a label for every group, in both languages", () => {
    for (const lang of ["ar", "en"] as const) {
      const d = dictionaries[lang] as Record<string, string>;
      for (const tab of ADMIN_TABS) {
        expect(d[`admin.tab.${tab}`], `${lang} tab ${tab}`).toBeTruthy();
        expect(d[`admin.desc.${tab}`], `${lang} desc ${tab}`).toBeTruthy();
      }
      for (const group of ADMIN_GROUPS.filter((g) => g.key !== "main")) expect(d[`admin.group.${group.key}`], `${lang} group ${group.key}`).toBeTruthy();
    }
  });
});
