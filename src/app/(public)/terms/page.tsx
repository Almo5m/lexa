import { LegalView } from "@/components/legal-page";
import { TERMS } from "@/features/legal/content";
import { getLang } from "@/lib/i18n/server";

export const metadata = { title: "Terms" };

export default async function TermsPage() {
  return <LegalView page={TERMS[await getLang()]} />;
}
