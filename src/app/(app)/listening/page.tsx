import Link from "next/link";
import { requireUserPage } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { LISTENING_TASKS } from "@/features/listening/tasks";

export const metadata = { title: "Listening" };

export default async function ListeningPage() {
  await requireUserPage();
  const { t } = await getT();
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("listening.title")}</h1>
        <p className="text-ink-soft">{t("listening.intro")}</p>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {LISTENING_TASKS.map((task) => (
          <li key={task.id}>
            <Link href={`/listening/${task.id}`} className="flex min-h-16 items-center justify-between gap-4 px-1 py-2 hover:bg-paper-deep/60">
              <span>
                <span className="block text-sm text-ink-soft">{t("grammar.unit", { n: task.unit })}</span>
                <span className="block text-lg font-medium" dir="ltr">{task.title}</span>
              </span>
              <span aria-hidden="true" className="text-indigo ltr:rotate-180">‹</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
