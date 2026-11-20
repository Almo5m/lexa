import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { BoMark } from "@/components/bo-mark";
import { requireAdminPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { loadBadgeCounts } from "@/features/admin/counts";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  const { t } = await getT();
  const counts = await loadBadgeCounts(createSupabaseAdminClient()).catch(() => ({}));
  return (
    <div data-theme="admin" className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <BoMark size={38} />
            <div className="leading-tight">
              <p className="font-bold">{t("brand.app")}</p>
              <p className="text-sm text-ink-soft">{t("admin.title")}</p>
            </div>
          </div>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-lg px-4 text-ink-soft shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-paper-deep">
            {t("nav.home")}
          </Link>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 lg:flex-row lg:gap-8">
        <Suspense fallback={null}>
          <AdminNav counts={counts} />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
