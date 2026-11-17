import Link from "next/link";
import { PlusRedeem } from "@/components/plus-redeem";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { daysLeft, isPlus } from "@/features/plus/plan";
import { loadPlusUntil } from "@/features/plus/server";

export const metadata = { title: "Booo Plus" };

const FEATURES = ["ai", "export", "look"] as const;

export default async function PlusPage() {
  const { user } = await requireUserPage();
  const { t } = await getT();
  const [settings, until] = await Promise.all([loadSettings(), loadPlusUntil(createSupabaseAdminClient(), user.id)]);
  const plus = isPlus(until);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="hero-card space-y-2 p-6">
        <h1 className="text-2xl font-bold">{t("plus.title")}</h1>
        <p className="opacity-90">{plus ? t("plus.activeLine", { n: daysLeft(until) }) : t("plus.pitch")}</p>
        {settings.plusPrice && !plus && <p className="text-lg font-bold">{settings.plusPrice}</p>}
      </div>

      <section className="sheet space-y-3 p-5" aria-labelledby="plus-what">
        <h2 id="plus-what" className="text-lg font-bold">{t("plus.whatTitle")}</h2>
        <p className="rounded-[var(--r-md)] bg-paper-deep p-3 text-sm font-semibold">{t("plus.freeStays")}</p>
        <ul className="space-y-2">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex gap-3">
              <span aria-hidden="true" className="font-bold text-leaf">✓</span>
              <span>{t(`plus.feature.${feature}` as never, { n: settings.plusAiMultiplier })}</span>
            </li>
          ))}
        </ul>
      </section>

      {plus && (
        <a href="/api/words/export" download className="tag-btn tag-btn-grad w-full justify-center">{t("plus.export")}</a>
      )}

      {!plus && settings.plusHowToBuy && (
        <section className="sheet space-y-2 p-5" aria-labelledby="plus-buy">
          <h2 id="plus-buy" className="text-lg font-bold">{t("plus.howTitle")}</h2>
          <p className="whitespace-pre-wrap leading-8">{settings.plusHowToBuy}</p>
        </section>
      )}

      <PlusRedeem />
      <p className="text-center text-sm text-ink-soft">
        <Link href="/terms" className="transition-colors hover:text-indigo">{t("legal.terms")}</Link>
      </p>
    </div>
  );
}
