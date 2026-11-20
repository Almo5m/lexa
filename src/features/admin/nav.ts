/** The dashboard tabs, grouped the way an admin thinks about them. The group order is the sidebar order. */
export const ADMIN_GROUPS = [
  { key: "main", tabs: ["overview"] },
  { key: "students", tabs: ["students", "feedback"] },
  { key: "content", tabs: ["school", "grammar", "cards", "hooks", "wod", "bo", "contest"] },
  { key: "money", tabs: ["codes"] },
  { key: "system", tabs: ["ai", "launch", "settings"] },
] as const;

export type AdminTab = (typeof ADMIN_GROUPS)[number]["tabs"][number];
export const ADMIN_TABS: readonly AdminTab[] = ADMIN_GROUPS.flatMap((group) => group.tabs);

export function isAdminTab(value: unknown): value is AdminTab {
  return typeof value === "string" && (ADMIN_TABS as readonly string[]).includes(value);
}

/** Tabs that can show a number badge because something waits for the admin. */
export type BadgeCounts = Partial<Record<AdminTab, number>>;
