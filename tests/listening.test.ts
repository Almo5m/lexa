import { describe, expect, it } from "vitest";
import { LISTENING_TASKS, listeningTask } from "@/features/listening/tasks";
import { TOPICS } from "@/features/talk/topics";

describe("listening content", () => {
  it("has valid questions and unique ids", () => {
    expect(new Set(LISTENING_TASKS.map((t) => t.id)).size).toBe(LISTENING_TASKS.length);
    for (const task of LISTENING_TASKS) {
      expect(task.script.split(/\s+/).length).toBeGreaterThan(50);
      expect(task.questions.length).toBe(4);
      for (const q of task.questions) {
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
      expect(listeningTask(task.id)).toBe(task);
    }
  });

  it("keeps speaking topic ids unique", () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
  });
});
