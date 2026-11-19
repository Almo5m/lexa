import { describe, expect, it } from "vitest";
import { buildSkillTasks, taskFromId } from "@/features/levels/tasks";
import { combineLevels } from "@/features/levels/combine";

describe("skill tasks", () => {
  it("builds seven tasks at every level, with different ids", () => {
    for (let level = 1; level <= 5; level++) {
      const tasks = buildSkillTasks(level);
      expect(tasks).toHaveLength(7);
      expect(new Set(tasks.map((task) => task.id)).size).toBe(7);
      expect(tasks.filter((task) => task.type === "word")).toHaveLength(2);
      expect(tasks.filter((task) => task.type === "write")).toHaveLength(1);
    }
  });
  it("finds every task again from its id, with the same text", () => {
    for (let level = 1; level <= 5; level++) {
      for (const task of buildSkillTasks(level)) expect(taskFromId(task.id)).toEqual(task);
    }
  });
  it("rejects ids that are not ours", () => {
    for (const id of ["", "e99", "e600", "w:notaword", "p9", "x1", "e10; drop"]) expect(taskFromId(id)).toBeNull();
  });
});

describe("combined level", () => {
  it("leans on the AI part but stays within one band of the vocabulary", () => {
    expect(combineLevels(3, 3)).toBe(3);
    expect(combineLevels(2, 5)).toBe(3);
    expect(combineLevels(4, 1)).toBe(3);
    expect(combineLevels(1, 1)).toBe(1);
    expect(combineLevels(5, 5)).toBe(5);
  });
});
