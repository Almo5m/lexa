import { AccountForm } from "@/components/account-form";
import { ShareManager } from "@/components/share-manager";
import { isActive } from "@/features/share/token";
import { InterestsForm } from "@/components/interests-form";
import { BoLookPicker } from "@/components/bo-look-picker";
import { levelFromXp } from "@/features/gamification/xp";
import { BoVisibility } from "@/components/bo-visibility";
import { BoMascot } from "@/components/bo-mascot";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Me" };

export default async function MePage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const [{ data: profile }, { data: link }] = await Promise.all([
    supabase.from("profiles").select("interests, display_name, total_xp").eq("id", user.id).single(),
    supabase.from("share_links").select("expires_at").eq("user_id", user.id).maybeSingle(),
  ]);
  const activeUntil = link && isActive(link.expires_at) ? link.expires_at : null;

  return (
    <div className="max-w-2xl space-y-6 lg:max-w-5xl">
      <div className="flex items-end gap-3">
        <BoMascot mood="happy" size={88} />
        <div>
          <h1 className="text-2xl font-semibold">{t("me.title")}</h1>
          <p className="text-ink-soft">{t("me.why")}</p>
        </div>
      </div>
      <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <section aria-labelledby="bo-title" className="sheet space-y-3 p-6">
          <h2 id="bo-title" className="text-xl font-bold">
            {t("boPicker.title")}
          </h2>
          <BoVisibility />
        </section>

        <section aria-labelledby="look-title" className="sheet space-y-3 p-6">
          <h2 id="look-title" className="text-xl font-bold">{t("look.title")}</h2>
          <BoLookPicker level={levelFromXp(profile?.total_xp ?? 0)} />
        </section>

        <section className="sheet p-6">
          <InterestsForm initial={profile?.interests ?? []} />
        </section>

        <section aria-labelledby="share-title" className="sheet space-y-3 p-6">
          <h2 id="share-title" className="text-xl font-bold">
            {t("share.title")}
          </h2>
          <ShareManager activeUntil={activeUntil} />
        </section>

        <section aria-labelledby="account-title" className="sheet p-6">
          <h2 id="account-title" className="mb-4 text-xl font-bold">
            {t("account.title")}
          </h2>
          <AccountForm initialName={profile?.display_name ?? ""} />
        </section>
      </div>
    </div>
  );
}
