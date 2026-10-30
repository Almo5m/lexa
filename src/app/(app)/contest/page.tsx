import { ContestSession } from "@/components/contest-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Weekly contest" };

export default async function ContestPage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{t("contest.title")}</h1>
      <ContestSession />
    </div>
  );
}
