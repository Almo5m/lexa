import { describe, expect, it } from "vitest";
import { WRITING_TASKS, countWords, writingTask } from "@/features/writing/tasks";
import { totalMarks, writingGradeSchema } from "@/features/writing/schemas";

describe("writing tasks", () => {
  it("have unique ids, sane limits and a plan", () => {
    expect(new Set(WRITING_TASKS.map((t) => t.id)).size).toBe(WRITING_TASKS.length);
    for (const task of WRITING_TASKS) {
      expect(task.minWords).toBeLessThan(task.maxWords);
      expect(task.planAr.length).toBeGreaterThan(1);
      expect(writingTask(task.id)).toBe(task);
    }
    expect(writingTask("nope")).toBeUndefined();
  });

  it("counts words ignoring extra spaces and lines", () => {
    expect(countWords("  one   two\nthree ")).toBe(3);
    expect(countWords("   ")).toBe(0);
  });

  it("validates and totals a grade", () => {
    const grade = writingGradeSchema.parse({
      content: 4, organization: 3, grammar: 3, vocabulary: 4,
      mistakes: [{ original: "he go", fixed: "he goes", explanationAr: "x" }],
      improvedVersion: "text", feedbackAr: "ok",
    });
    expect(totalMarks(grade)).toBe(14);
    expect(() => writingGradeSchema.parse({ ...grade, content: 9 })).toThrow();
  });
});
