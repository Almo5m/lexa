import { AddFlow } from "@/components/add-flow";
import { getT } from "@/lib/i18n/server";
import { loadSettings } from "@/lib/settings-server";

export const metadata = { title: "Add words" };

export default async function AddPage() {
  const { t } = await getT();
  const settings = await loadSettings();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("add.title")}</h1>
      <AddFlow maxImages={settings.maxImagesPerUpload} maxImageMb={settings.maxImageSizeMb} />
    </div>
  );
}
