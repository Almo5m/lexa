import type { ReactNode } from "react";
import { AlmoSignature } from "@/components/almo-signature";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="flex flex-col items-center pt-8 text-center">
        <img src="/lexa/logo.webp" alt="Lexa" width={640} height={613} className="h-auto w-60" />
        <p className="mt-1 text-ink-soft">{t("app.tagline")}</p>
      </header>
      <main className="flex-1">{children}</main>
      <AlmoSignature />
    </div>
  );
}
