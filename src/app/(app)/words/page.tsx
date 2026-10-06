import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { statusOf, type WordRow } from "@/lib/words";
import type { WordStatus } from "@/features/srs/types";
import type { DictKey } from "@/lib/i18n/dictionary";

export const metadata = { title: "My words" };

const FILTERS = ["all", "new", "learning", "weak", "mastered"] as const;
type Filter = (typeof FILTERS)[number];

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; group?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filter: Filter = FILTERS.includes(params.filter as Filter) ? (params.filter as Filter) : "all";
  const { supabase } = await requireUserPage();
  const { t } = await getT();
  const settings = await loadSettings();

  const [{ data: wordsData }, { data: groups }] = await Promise.all([
    supabase
      .from("words")
      .select("id, term, card, card_status, ease, interval_days, repetitions, lapses, correct_count, wrong_count, due_at, last_reviewed_at, group_id")
      .order("term"),
    supabase.from("word_groups").select("id, name").order("name"),
  ]);

  const q = (params.q ?? "").trim().toLowerCase();
  const all = ((wordsData ?? []) as unknown as WordRow[]).map((row) => ({
    row,
    status: statusOf(row, settings),
  }));

  const visible = all.filter(
    ({ row, status }) =>
      (filter === "all" || status === filter) &&
      (!params.group || row.group_id === params.group) &&
      (!q || row.term.includes(q)),
  );

  const counts: Record<Filter, number> = {
    all: all.length,
    new: all.filter((w) => w.status === "new").length,
    learning: all.filter((w) => w.status === "learning").length,
    weak: all.filter((w) => w.status === "weak").length,
    mastered: all.filter((w) => w.status === "mastered").length,
  };

  const statusLabel: Record<WordStatus, DictKey> = {
    new: "card.status.new",
    learning: "card.status.learning",
    weak: "card.status.weak",
    mastered: "card.status.mastered",
  };

  const href = (next: Partial<{ filter: string; group: string }>) => {
    const search = new URLSearchParams();
    const f = next.filter ?? filter;
    const g = "group" in next ? next.group : params.group;
    if (f !== "all") search.set("filter", f);
    if (g) search.set("group", g);
    if (q) search.set("q", q);
    const text = search.toString();
    return text ? `/words?${text}` : "/words";
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("words.title")}</h1>

      <form action="/words" className="flex gap-3">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        {params.group && <input type="hidden" name="group" value={params.group} />}
        <label htmlFor="q" className="sr-only">
          {t("words.search")}
        </label>
        <input id="q" name="q" defaultValue={q} placeholder={t("words.search")} className="field ltr-text" />
      </form>

      <nav aria-label={t("words.title")} className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Link
            key={item}
            href={href({ filter: item })}
            aria-current={filter === item ? "true" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
              filter === item ? "bg-ink font-medium text-sheet" : "shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep"
            }`}
          >
            {t(`words.${item}` as DictKey)} · {counts[item]}
          </Link>
        ))}
      </nav>

      {groups && groups.length > 0 && (
        <nav aria-label="Groups" className="flex flex-wrap gap-2 text-sm">
          <Link href={href({ group: undefined })} className="min-h-11 content-center px-2 underline underline-offset-4">
            {t("words.all")}
          </Link>
          {groups.map((group) => (
            <Link
              key={group.id}
              href={href({ group: group.id })}
              aria-current={params.group === group.id ? "true" : undefined}
              className={`min-h-11 content-center px-2 underline underline-offset-4 ${params.group === group.id ? "font-semibold" : "text-ink-soft"}`}
            >
              {group.name}
            </Link>
          ))}
        </nav>
      )}

      {visible.length === 0 ? (
        <p className="text-ink-soft">{filter === "weak" ? t("words.emptyWeak") : t("words.empty")}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map(({ row, status }) => (
            <li key={row.id}>
              <Link
                href={`/words/${row.id}`}
                className="flex min-h-14 items-center justify-between gap-4 px-1 hover:bg-paper-deep/60"
              >
                <span className="ltr-text text-lg font-medium">{row.term}</span>
                <span className="flex items-center gap-3 text-sm text-ink-soft">
                  <span className={status === "weak" ? "pen-error text-pen-red" : status === "mastered" ? "text-leaf" : ""}>
                    {t(statusLabel[status])}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
