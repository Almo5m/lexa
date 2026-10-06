import type { ReactNode } from "react";
import { AlmoSignature } from "@/components/almo-signature";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = await getT();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <header className="pt-10">
        <p className="text-4xl font-semibold tracking-tight">Lexa</p>
        <p className="mt-1 text-ink-soft">{t("app.tagline")}</p>
      </header>
      <main className="flex-1">{children}</main>
      <AlmoSignature />
    </div>
  );
}
