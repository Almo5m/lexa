import { StepBanner } from "@/components/step-banner";
import { LearnSession } from "@/components/learn-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Learn" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ more?: string; unit?: string; track?: string }> }) {
  await requireUserPage();
  const { t } = await getT();
  const { more, unit, track } = await searchParams;
  const unitId = unit && /^[0-9a-f-]{36}$/i.test(unit) ? unit : undefined;
  return (
    <div className="max-w-2xl space-y-6">
      <StepBanner step="learn" />
      <h1 className="text-2xl font-semibold">{t("learn.title")}</h1>
      <LearnSession key={`${more}-${unitId}-${track}`} more={more === "1"} unit={unitId} track={track === "path" ? "path" : undefined} />
    </div>
  );
}
