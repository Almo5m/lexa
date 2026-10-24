import { notFound } from "next/navigation";
import { ListeningSession } from "@/components/listening-session";
import { requireUserPage } from "@/lib/auth";
import { listeningTask } from "@/features/listening/tasks";

export default async function ListeningTaskPage({ params }: { params: Promise<{ task: string }> }) {
  await requireUserPage();
  const { task } = await params;
  const found = listeningTask(task);
  if (!found) notFound();
  return (
    <div className="max-w-2xl">
      <ListeningSession task={found} />
    </div>
  );
}
