import { notFound } from "next/navigation";
import { WritingSession } from "@/components/writing-session";
import { requireUserPage } from "@/lib/auth";
import { writingTask } from "@/features/writing/tasks";

export default async function WritingTaskPage({ params }: { params: Promise<{ task: string }> }) {
  await requireUserPage();
  const { task } = await params;
  const found = writingTask(task);
  if (!found) notFound();
  return (
    <div className="max-w-2xl">
      <WritingSession task={found} />
    </div>
  );
}
