import Link from "next/link";
import { BoMascot } from "@/components/bo-mascot";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <BoMascot mood="neutral" size={130} />
      <h1 className="text-2xl font-bold">{t("notfound.title")}</h1>
      <p className="text-ink-soft">{t("notfound.text")}</p>
      <Link href="/" className="tag-btn tag-btn-grad">{t("nav.home")}</Link>
    </main>
  );
}
