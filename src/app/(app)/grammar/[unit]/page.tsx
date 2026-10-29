import { notFound } from "next/navigation";
import { GrammarSession } from "@/components/grammar-session";
import { requireUserPage } from "@/lib/auth";
import { grammarUnit } from "@/features/grammar";
import { loadLessonImages } from "@/features/grammar/lesson-images";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export default async function GrammarUnitPage({ params }: { params: Promise<{ unit: string }> }) {
  await requireUserPage();
  const { unit } = await params;
  const found = grammarUnit(unit);
  if (!found) notFound();
  // The teacher's own explanation pictures, when the admin uploaded them. Without them the built-in text is shown.
  const images = await loadLessonImages(createSupabaseAdminClient(), found.id).catch(() => []);
  return (
    <div className="max-w-2xl">
      <GrammarSession unit={found} images={images.map((image) => ({ id: image.id, url: image.url }))} />
    </div>
  );
}
