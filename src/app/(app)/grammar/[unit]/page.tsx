import { notFound } from "next/navigation";
import { GrammarSession } from "@/components/grammar-session";
import { requireUserPage } from "@/lib/auth";
import { grammarUnit } from "@/features/grammar";

export default async function GrammarUnitPage({ params }: { params: Promise<{ unit: string }> }) {
  await requireUserPage();
  const { unit } = await params;
  const found = grammarUnit(unit);
  if (!found) notFound();
  return (
    <div className="max-w-2xl">
      <GrammarSession unit={found} />
    </div>
  );
}
