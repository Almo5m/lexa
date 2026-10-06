import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  const { t } = await getT();
  return (
    <div data-theme="admin" className="min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <p className="text-xl font-semibold">Lexa · {t("admin.title")}</p>
        <Link href="/" className="min-h-11 content-center text-ink-soft underline underline-offset-4">
          {t("nav.home")}
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16">{children}</main>
    </div>
  );
}
