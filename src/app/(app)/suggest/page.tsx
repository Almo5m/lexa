import Link from "next/link";
import { SuggestList } from "@/components/suggest-list";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { suggestWords } from "@/features/levels/placement";

export const metadata = { title: "Suggested words" };
export const dynamic = "force-dynamic";

export default async function SuggestPage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();

  const [{ data: profile }, { data: owned }] = await Promise.all([
    supabase.from("profiles").select("level_band").eq("id", user.id).single(),
    supabase.from("words").select("term"),
  ]);

  const level = profile?.level_band ?? null;
  const words = level ? suggestWords(level, (owned ?? []).map((row) => row.term), 10) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("suggest.title")}</h1>
      {level === null ? (
        <div className="space-y-4">
          <p>{t("suggest.needLevel")}</p>
          <Link href="/level" className="tag-btn">
            {t("practice.level")}
          </Link>
        </div>
      ) : words.length === 0 ? (
        <p className="text-ink-soft">{t("suggest.none")}</p>
      ) : (
        <>
          <p className="text-ink-soft">{t("suggest.intro")}</p>
          <SuggestList words={words} />
        </>
      )}
    </div>
  );
}
