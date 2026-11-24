import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { chosenStage } from "@/features/stage/stage";
import { writingTasksFor } from "@/features/writing/tasks";

export const metadata = { title: "Writing" };

export default async function WritingPage() {
  const { supabase, user } = await requireUserPage();
  const { data: profile } = await supabase.from("profiles").select("stage").eq("id", user.id).single();
  const tasks = writingTasksFor(chosenStage(profile?.stage));
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("writing.title")}</h1>
        <p className="text-ink-soft">{t("writing.intro")}</p>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {tasks.map((task) => (
          <li key={task.id}>
            <Link href={`/writing/${task.id}`} className="flex min-h-16 items-center justify-between gap-4 px-1 py-2 hover:bg-paper-deep/60">
              <span>
                <span className="block text-sm text-ink-soft">{t("grammar.unit", { n: task.unit })}</span>
                <span className="block text-lg font-medium" dir="ltr">{task.titleEn}</span>
              </span>
              <span aria-hidden="true" className="text-indigo ltr:rotate-180">‹</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
