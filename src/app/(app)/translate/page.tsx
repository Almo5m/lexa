import { TranslateSession } from "@/components/translate-session";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Translation" };

export default async function TranslatePage() {
  const { t } = await getT();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("translate.title")}</h1>
      <TranslateSession />
    </div>
  );
}
