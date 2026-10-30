import { ChallengeSession } from "@/components/challenge-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Daily challenge" };

export default async function ChallengePage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("challenge.title")}</h1>
      <ChallengeSession />
    </div>
  );
}
