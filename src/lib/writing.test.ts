import { describe, expect, it } from "vitest";
import { chapterWrittenToday, utcDayStartISO } from "./writing";

describe("chapterWrittenToday", () => {
  const today = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  it("returns null with no rows", () => {
    expect(chapterWrittenToday(null)).toBeNull();
    expect(chapterWrittenToday(undefined)).toBeNull();
    expect(chapterWrittenToday([])).toBeNull();
  });

  it("returns null when everything was written before today", () => {
    expect(
      chapterWrittenToday([
        { prompt_key: "writing:A1:a", completed_at: yesterday },
        { prompt_key: "writing:A1:b", completed_at: "2026-01-01T09:00:00.000Z" },
      ])
    ).toBeNull();
  });

  it("returns the prompt_key completed today", () => {
    expect(
      chapterWrittenToday([
        { prompt_key: "writing:A1:a", completed_at: yesterday },
        { prompt_key: "writing:A1:b", completed_at: today },
      ])
    ).toBe("writing:A1:b");
  });

  it("treats exactly the UTC day boundary as today", () => {
    expect(
      chapterWrittenToday([{ prompt_key: "writing:A1:a", completed_at: utcDayStartISO() }])
    ).toBe("writing:A1:a");
  });
});
