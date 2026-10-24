import { StepBanner } from "@/components/step-banner";
import { ReadingSession } from "@/components/reading-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Read" };

export default async function ReadPage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-6">
      <StepBanner step="read" />
      <h1 className="text-2xl font-semibold">{t("read.title")}</h1>
      <ReadingSession />
    </div>
  );
}
