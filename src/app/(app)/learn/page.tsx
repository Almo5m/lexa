import { LearnSession } from "@/components/learn-session";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Learn" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ more?: string }> }) {
  await requireUserPage();
  const { t } = await getT();
  const { more } = await searchParams;
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("learn.title")}</h1>
      <LearnSession key={more === "1" ? "more" : "today"} more={more === "1"} />
    </div>
  );
}
