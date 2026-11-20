import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadLessonImages } from "@/features/grammar/lesson-images";
import { loadTopics } from "@/features/grammar/topics";
import { chosenStage } from "@/features/stage/stage";

/** An extra grammar lesson the admin made for a stage: its explanation pictures in order. */
export default async function GrammarTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: profile } = await supabase.from("profiles").select("stage").eq("id", user.id).single();
  const stage = chosenStage(profile?.stage);
  const topic = (await loadTopics(supabase, stage)).find((item) => item.id === id);
  if (!topic) notFound();
  const images = await loadLessonImages(createSupabaseAdminClient(), id).catch(() => []);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/grammar" className="text-sm text-indigo">{t("grammar.title")}</Link>
        <h1 className="text-2xl font-semibold">{topic.title}</h1>
      </div>
      {images.length === 0 ? (
        <p className="sheet p-6 text-center text-ink-soft">{t("grammar.topicEmpty")}</p>
      ) : (
        <section className="space-y-3" aria-label={t("grammar.lesson")}>
          <ol className="space-y-3">
            {images.map((image, index) => (
              <li key={image.id}>
                <a href={image.url} target="_blank" rel="noopener noreferrer" className="sheet block overflow-hidden p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={t("grammar.imageAlt", { n: index + 1 })} loading={index === 0 ? "eager" : "lazy"} className="h-auto w-full rounded-xl" />
                </a>
              </li>
            ))}
          </ol>
          <p className="text-center text-xs text-ink-faint">{t("grammar.imageTap")}</p>
        </section>
      )}
    </div>
  );
}
