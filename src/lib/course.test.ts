import { describe, expect, it } from "vitest";
import {
  COURSE_DAYS,
  COURSE_SECTIONS,
  COURSE_TOTAL_DAYS,
  DAY_QUIZZES,
  getCourseDay,
  nextCourseDay,
} from "@/lib/course";

describe("course data invariants", () => {
  it("has 16 days numbered 1..16 in order", () => {
    expect(COURSE_TOTAL_DAYS).toBe(16);
    expect(COURSE_DAYS.map((d) => d.day)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1)
    );
  });

  it("every day key matches course-day-<n> (what path_progress stores)", () => {
    for (const d of COURSE_DAYS) {
      expect(d.key).toBe(`course-day-${d.day}`);
    }
  });

  it("sections cover all days exactly once", () => {
    const sectionDays = COURSE_SECTIONS.flatMap((s) => s.days.map((d) => d.day));
    expect([...sectionDays].sort((a, b) => a - b)).toEqual(
      COURSE_DAYS.map((d) => d.day)
    );
  });

  it("every quiz belongs to a real day and its answer is one of the options", () => {
    for (const [day, questions] of Object.entries(DAY_QUIZZES)) {
      expect(getCourseDay(Number(day))).not.toBeNull();
      for (const q of questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options).toContain(q.answer);
      }
    }
  });
});

describe("getCourseDay", () => {
  it("returns the matching day", () => {
    expect(getCourseDay(1)?.day).toBe(1);
    expect(getCourseDay(16)?.day).toBe(16);
  });

  it("returns null out of range", () => {
    expect(getCourseDay(0)).toBeNull();
    expect(getCourseDay(17)).toBeNull();
  });
});

describe("nextCourseDay", () => {
  it("starts at day 1 with nothing done", () => {
    expect(nextCourseDay(new Set())?.day).toBe(1);
  });

  it("advances past completed days", () => {
    expect(nextCourseDay(new Set(["course-day-1"]))?.day).toBe(2);
  });

  it("fills gaps before moving on", () => {
    expect(nextCourseDay(new Set(["course-day-1", "course-day-3"]))?.day).toBe(2);
  });

  it("returns null when the whole course is done", () => {
    const all = new Set(COURSE_DAYS.map((d) => d.key));
    expect(nextCourseDay(all)).toBeNull();
  });

  it("ignores unrelated step keys", () => {
    expect(nextCourseDay(new Set(["hangul-vowels", "junk"]))?.day).toBe(1);
  });
});
