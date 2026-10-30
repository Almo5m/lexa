import { notFound } from "next/navigation";
import { ChallengeSession } from "@/components/challenge-session";
import { DuelShare } from "@/components/duel-share";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { isDuelCode } from "@/features/duel/code";

export const metadata = { title: "Duel" };

export default async function DuelCodePage({ params }: { params: Promise<{ code: string }> }) {
  await requireUserPage();
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  if (!isDuelCode(code)) notFound();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{t("duel.title")}</h1>
      <DuelShare code={code} />
      <ChallengeSession api={`/api/duel/${code}`} />
    </div>
  );
}
