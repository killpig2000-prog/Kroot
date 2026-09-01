import { describe, expect, it } from "vitest";
import {
  MAX_BOX,
  REVIEW_SESSION_SIZE,
  REVIEW_SESSION_SIZES,
  SRS_INTERVALS_DAYS,
  nextBox,
  nextReviewAt,
  resolveReviewSize,
} from "@/lib/srs";

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

describe("resolveReviewSize", () => {
  it("defaults to the standard session for anything it doesn't recognise", () => {
    expect(resolveReviewSize(undefined)).toBe(REVIEW_SESSION_SIZE);
    expect(resolveReviewSize("")).toBe(REVIEW_SESSION_SIZE);
    expect(resolveReviewSize("abc")).toBe(REVIEW_SESSION_SIZE);
    // Not on the offered list: a hand-typed ?n= must not become the limit.
    expect(resolveReviewSize("500")).toBe(REVIEW_SESSION_SIZE);
    expect(resolveReviewSize("-5")).toBe(REVIEW_SESSION_SIZE);
    expect(resolveReviewSize("0")).toBe(REVIEW_SESSION_SIZE);
  });

  it("accepts each offered size", () => {
    for (const size of REVIEW_SESSION_SIZES) {
      expect(resolveReviewSize(String(size))).toBe(size);
    }
  });

  it("takes the first value when the query string repeats ?n=", () => {
    expect(resolveReviewSize(["20", "30"])).toBe(20);
  });
});
