import { LegalView } from "@/components/legal-page";
import { PRIVACY } from "@/features/legal/content";
import { getLang } from "@/lib/i18n/server";

export const metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  return <LegalView page={PRIVACY[await getLang()]} />;
}
