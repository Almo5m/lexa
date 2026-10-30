import { DuelStart } from "@/components/duel-start";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Challenge a friend" };

export default async function DuelPage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{t("duel.title")}</h1>
      <DuelStart />
    </div>
  );
}
