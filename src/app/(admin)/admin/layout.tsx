import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  const { t } = await getT();
  return (
    <div data-theme="admin" className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/lexa/owl.webp" alt="" width={44} height={37} />
            <div className="leading-tight">
              <p className="text-lg font-bold">Lexa</p>
              <p className="text-sm text-ink-soft">{t("admin.title")}</p>
            </div>
          </div>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full px-4 text-ink-soft shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep">
            {t("nav.home")}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
    </div>
  );
}
