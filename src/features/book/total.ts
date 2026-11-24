import { GRAMMAR_UNITS } from "@/features/grammar";
import { LISTENING_TASKS } from "@/features/listening/tasks";
import { writingTasksFor } from "@/features/writing/tasks";

/** How many scored book tasks a stage has. Year 1 and Year 2 grammar is explained by uploaded lessons and is not scored. */
export function bookTotalFor(stage: string | null): number {
  if (stage === null) return GRAMMAR_UNITS.length + writingTasksFor(null).length + LISTENING_TASKS.length;
  if (stage === "sec3") return GRAMMAR_UNITS.length + writingTasksFor("sec3").length + LISTENING_TASKS.length;
  return writingTasksFor(stage).length;
}
