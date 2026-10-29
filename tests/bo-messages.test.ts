import { describe, expect, it } from "vitest";
import { EMPTY_STATE, afterShown, canShowNow, dailyMessage, fillName, parseState, pickMessage } from "@/features/bo/messages";

const messages = [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }];

describe("canShowNow", () => {
  const min = 60_000;
  it("respects the gap and the daily limit", () => {
    const state = { day: "2026-10-29", count: 1, lastAt: 1000, seen: [] };
    expect(canShowNow(state, 1000 + 10 * min, "2026-10-29", 20, 4)).toBe(false);
    expect(canShowNow(state, 1000 + 20 * min, "2026-10-29", 20, 4)).toBe(true);
    expect(canShowNow({ ...state, count: 4 }, 1000 + 99 * min, "2026-10-29", 20, 4)).toBe(false);
  });
  it("starts the count again on a new day and is off when set to 0", () => {
    const state = { day: "2026-10-28", count: 4, lastAt: 1000, seen: [] };
    expect(canShowNow(state, 1000 + 30 * min, "2026-10-29", 20, 4)).toBe(true);
    expect(canShowNow(EMPTY_STATE, Date.now(), "2026-10-29", 0, 4)).toBe(false);
    expect(canShowNow(EMPTY_STATE, Date.now(), "2026-10-29", 20, 0)).toBe(false);
  });
});

describe("pickMessage", () => {
  it("skips the ones already seen in this round", () => {
    expect(pickMessage(messages, ["a", "b"], () => 0)?.id).toBe("c");
  });
  it("starts a new round without repeating the last one", () => {
    expect(pickMessage(messages, ["a", "b", "c"], () => 0)?.id).not.toBe("c");
    expect(pickMessage([], [])).toBeNull();
    expect(pickMessage([messages[0]], ["a"])?.id).toBe("a");
  });
});

describe("afterShown", () => {
  it("counts the message and restarts the round when all were shown", () => {
    const one = afterShown(EMPTY_STATE, messages[0], 5, "d", 3);
    expect(one).toEqual({ day: "d", count: 1, lastAt: 5, seen: ["a"] });
    const full = afterShown({ ...one, seen: ["a", "b"] }, messages[2], 9, "d", 3);
    expect(full.seen).toEqual(["c"]);
  });
});

describe("fillName", () => {
  it("uses the first name", () => {
    expect(fillName("يلا يا {name}!", "Ahmed Hassan")).toBe("يلا يا Ahmed!");
  });
  it("removes the placeholder cleanly when there is no name", () => {
    expect(fillName("يلا يا {name}!", "")).toBe("يلا يا!");
    expect(fillName("Hello {name}, keep going.", "  ")).toBe("Hello, keep going.");
  });
});

describe("dailyMessage and parseState", () => {
  it("is stable for the same day and student", () => {
    expect(dailyMessage(messages, "2026-10-29", "u1")).toEqual(dailyMessage(messages, "2026-10-29", "u1"));
    expect(dailyMessage([], "d", "u")).toBeNull();
  });
  it("survives damaged storage", () => {
    expect(parseState("{bad")).toEqual(EMPTY_STATE);
    expect(parseState(null)).toEqual(EMPTY_STATE);
    expect(parseState('{"day":"d","count":2,"lastAt":7,"seen":["a",3]}')).toEqual({ day: "d", count: 2, lastAt: 7, seen: ["a"] });
  });
});
