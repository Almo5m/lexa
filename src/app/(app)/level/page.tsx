import { LevelTest } from "@/components/level-test";
import { getT } from "@/lib/i18n/server";
import { buildPlacementTest } from "@/features/levels/placement";

export const metadata = { title: "Level test" };
export const dynamic = "force-dynamic";

export default async function LevelPage() {
  const { t } = await getT();
  const words = buildPlacementTest().map((item) => item.word);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("level.title")}</h1>
      <LevelTest words={words} />
    </div>
  );
}
