import { FeedbackForm } from "@/components/feedback-form";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Feedback" };

export default async function FeedbackPage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("feedback.title")}</h1>
        <p className="text-ink-soft">{t("feedback.hint")}</p>
      </div>
      <FeedbackForm />
    </div>
  );
}
