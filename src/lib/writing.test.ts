import { describe, expect, it } from "vitest";
import { LEVEL_ORDER } from "@/lib/tree";
import { DAILY_LIFE_PROMPTS } from "@/lib/writing-data/daily-life";
import { CHAPTER_SIZE, getChaptersForLevel, getPromptsForLevel, getSiblingPrompts } from "@/lib/writing";

describe("writing prompt keys", () => {
  // The bug this exists to prevent: the key was built from prompt_kr, which is
  // the shared instruction line, so 936 prompts collapsed onto 474 keys and a
  // single finished chapter marked its whole genre done.
  it("are unique across every prompt in the library", () => {
    const keys = LEVEL_ORDER.flatMap((level) => getPromptsForLevel(level).map((p) => p.key));
    expect(keys).toHaveLength(DAILY_LIFE_PROMPTS.length);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("are unique within each level", () => {
    for (const level of LEVEL_ORDER) {
      const keys = getPromptsForLevel(level).map((p) => p.key);
      expect(new Set(keys).size, `duplicate keys at ${level}`).toBe(keys.length);
    }
  });
});

describe("assemble boards have distractors to draw from", () => {
  it("finds siblings for every chapter of every level, including replies", () => {
    for (const level of LEVEL_ORDER) {
      const chapters = getChaptersForLevel(level);
      expect(chapters.length).toBeGreaterThan(0);
      for (const chapter of chapters) {
        const siblings = getSiblingPrompts(level, chapter);
        // Same genre, never one of the chapter's own prompts.
        expect(siblings.length, `no siblings for ${level} ${chapter[0]?.genre}`).toBeGreaterThan(0);
        for (const s of siblings) {
          expect(s.genre).toBe(chapter[0]?.genre);
          expect(chapter.some((p) => p.key === s.key)).toBe(false);
        }
      }
    }
  });

  it("keeps whole chapters inside one genre", () => {
    for (const level of LEVEL_ORDER) {
      for (const chapter of getChaptersForLevel(level)) {
        expect(chapter.length).toBeLessThanOrEqual(CHAPTER_SIZE);
        expect(new Set(chapter.map((p) => p.genre)).size).toBe(1);
      }
    }
  });
});
