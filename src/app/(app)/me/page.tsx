import { ShareManager } from "@/components/share-manager";
import { isActive } from "@/features/share/token";
import { InterestsForm } from "@/components/interests-form";
import { LexaMascot } from "@/components/lexa-mascot";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Me" };

export default async function MePage() {
  const { supabase, user } = await requireUserPage();
  const { t } = await getT();
  const [{ data: profile }, { data: link }] = await Promise.all([
    supabase.from("profiles").select("interests").eq("id", user.id).single(),
    supabase.from("share_links").select("expires_at").eq("user_id", user.id).maybeSingle(),
  ]);
  const activeUntil = link && isActive(link.expires_at) ? link.expires_at : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-end gap-3">
        <LexaMascot mood="happy" size={88} />
        <div>
          <h1 className="text-2xl font-semibold">{t("me.title")}</h1>
          <p className="text-ink-soft">{t("me.why")}</p>
        </div>
      </div>
      <section className="sheet p-6">
        <InterestsForm initial={profile?.interests ?? []} />
      </section>

      <section aria-labelledby="share-title" className="sheet space-y-3 p-6">
        <h2 id="share-title" className="text-xl font-bold">
          {t("share.title")}
        </h2>
        <ShareManager activeUntil={activeUntil} />
      </section>
    </div>
  );
}
