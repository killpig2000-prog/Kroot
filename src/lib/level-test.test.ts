import { describe, expect, it } from "vitest";
import {
  decodePlacement,
  encodePlacement,
  orderForGoal,
  skippedPlacement,
  suggestLevel,
  surveyPlacement,
  type FirstLesson,
} from "./level-test";

describe("suggestLevel", () => {
  it("takes the middle of three answers, whatever their order", () => {
    expect(suggestLevel(["A1", "C2", "B1"])).toBe("B1");
    expect(suggestLevel(["C2", "B1", "A1"])).toBe("B1");
  });

  it("ignores a single outlier", () => {
    expect(suggestLevel(["A2", "A2", "C1"])).toBe("A2");
    expect(suggestLevel(["C1", "A1", "C1"])).toBe("C1");
  });

  it("falls back to A1 with no answers and takes the lower middle of an even count", () => {
    expect(suggestLevel([])).toBe("A1");
    expect(suggestLevel(["B2", "A2"])).toBe("A2");
  });
});

describe("placement", () => {
  it("round-trips through the URL encoding", () => {
    const p = surveyPlacement("B1", "A2", "travel");
    expect(p.route).toBe("B1");
    expect(p.skipped).toBe(false);
    expect(decodePlacement(encodePlacement(p))).toEqual(p);
  });

  it("marks an unanswered survey as skipped", () => {
    expect(surveyPlacement("A1", null, null).skipped).toBe(true);
  });

  it("still reads a placement minted by the old quiz", () => {
    const old = { level: "A2", route: "A2", canRead: true, goal: "drama", score: 9, total: 11, skipped: false, stoppedAt: "B1", skills: {} };
    const raw = btoa(JSON.stringify(old)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodePlacement(raw)).toEqual({ level: "A2", route: "A2", canRead: true, goal: "drama", skipped: false, suggested: null });
  });

  it("rejects garbage", () => {
    expect(decodePlacement("not-base64!")).toBeNull();
    expect(decodePlacement(null)).toBeNull();
  });

  it("routes non-readers to Hangul", () => {
    expect(skippedPlacement(false, null).route).toBe("hangul");
    expect(skippedPlacement(true, null).route).toBe("A1");
  });
});

describe("orderForGoal", () => {
  const lessons: FirstLesson[] = [
    { href: "/hangul", label: "h", skill: "hangul", minutes: 6 },
    { href: "/g", label: "g", skill: "grammar", minutes: 6 },
    { href: "/w", label: "w", skill: "words", minutes: 8 },
    { href: "/l", label: "l", skill: "listening", minutes: 5 },
  ];
  it("keeps Hangul first and leads with the goal's skill", () => {
    expect(orderForGoal(lessons, "drama").map((l) => l.skill)).toEqual(["hangul", "listening", "grammar", "words"]);
    expect(orderForGoal(lessons, null)).toBe(lessons);
  });
});
