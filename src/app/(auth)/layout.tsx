import { BoMark } from "@/components/bo-mark";
import type { ReactNode } from "react";
import { AlmoSignature } from "@/components/almo-signature";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex flex-col items-center pt-8 text-center">
        <BoMark size={84} />
        <p className="mt-2 text-3xl font-bold tracking-tight">{t("brand.app")}</p>
        <p className="mt-1 text-ink-soft">{t("app.tagline")}</p>
      </header>
      <main className="flex-1">{children}</main>
      <AlmoSignature />
    </div>
  );
}
