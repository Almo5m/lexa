import Link from "next/link";
import { notFound } from "next/navigation";
import { WordCardView } from "@/components/word-card-view";
import { TutorChat } from "@/components/tutor-chat";
import { RetryCardButton } from "@/components/retry-card-button";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import type { WordCard } from "@/features/ai/schemas";

export default async function WordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireUserPage();
  const { t } = await getT();

  const { data: word } = await supabase
    .from("words")
    .select("id, term, card, card_status")
    .eq("id", id)
    .maybeSingle();
  if (!word) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/words" className="inline-flex min-h-11 items-center text-ink-soft underline underline-offset-4">
        {t("card.back")}
      </Link>

      {word.card_status === "ready" && word.card ? (
        <WordCardView card={word.card as WordCard} />
      ) : (
        <div className="sheet space-y-4 p-6">
          <h1 className="ltr-text text-3xl font-semibold">{word.term}</h1>
          <p className={word.card_status === "failed" ? "pen-error text-pen-red" : "text-ink-soft"}>
            {word.card_status === "failed" ? t("card.failed") : t("card.pending")}
          </p>
          <RetryCardButton wordId={word.id} />
        </div>
      )}

      <TutorChat wordId={word.id} />
    </div>
  );
}
