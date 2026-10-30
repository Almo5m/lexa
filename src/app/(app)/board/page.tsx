import { WeeklyBoard } from "@/components/weekly-board";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Weekly board" };

export default async function BoardPage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{t("board.title")}</h1>
      <WeeklyBoard />
    </div>
  );
}
