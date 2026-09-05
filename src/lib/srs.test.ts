import { describe, expect, it } from "vitest";
import { MAX_BOX, SRS_INTERVALS_DAYS, nextBox, nextReviewAt } from "@/lib/srs";

describe("nextBox", () => {
  it("advances one box on a correct review", () => {
    expect(nextBox(1, true)).toBe(2);
    expect(nextBox(3, true)).toBe(4);
  });

  it("caps at MAX_BOX on a correct review", () => {
    expect(nextBox(MAX_BOX, true)).toBe(MAX_BOX);
  });

  it("drops back to box 1 on a miss, from any box", () => {
    expect(nextBox(1, false)).toBe(1);
    expect(nextBox(MAX_BOX, false)).toBe(1);
  });

  it("clamps an out-of-range starting box before advancing", () => {
    expect(nextBox(0, true)).toBe(2);
    expect(nextBox(99, true)).toBe(MAX_BOX);
  });

  // A never-answered word carries the schema's default box of 1, which is a
  // placeholder rather than a 1-day interval it has served. Promoting it on
  // the first correct answer sent a word seen once, seconds ago, away for
  // three days; it earns the 1-day check-in first now.
  it("gives a first-ever correct answer box 1, not box 2", () => {
    expect(nextBox(1, true, false)).toBe(1);
  });

  it("still promotes normally once the word has been answered before", () => {
    expect(nextBox(1, true, true)).toBe(2);
    expect(nextBox(2, true, true)).toBe(3);
  });

  it("drops an unattempted word to box 1 on a miss, like any other", () => {
    expect(nextBox(1, false, false)).toBe(1);
  });
});

describe("nextReviewAt", () => {
  const from = new Date("2026-01-01T00:00:00.000Z");

  it("schedules the interval for the given box", () => {
    SRS_INTERVALS_DAYS.forEach((days, i) => {
      const box = i + 1;
      const expected = new Date(from.getTime() + days * 86_400_000).toISOString();
      expect(nextReviewAt(box, from)).toBe(expected);
    });
  });

  it("clamps an out-of-range box to the nearest valid interval", () => {
    expect(nextReviewAt(0, from)).toBe(nextReviewAt(1, from));
    expect(nextReviewAt(99, from)).toBe(nextReviewAt(MAX_BOX, from));
  });
});
