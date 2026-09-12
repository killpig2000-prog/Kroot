import { describe, expect, it } from "vitest";
import {
  ART_STAGE_STARTS,
  MAX_LEVEL,
  artStageForLevel,
  evolutionProgress,
  isDifficultyUnlocked,
  levelFromXp,
  levelProgress,
  treeStageForLevel,
  xpForNext,
  xpToReach,
} from "@/lib/level";

describe("xpForNext (curve v3, max Lv.50)", () => {
  it("starts at 8 and rises by 2 a level up to Lv.29", () => {
    expect(xpForNext(1)).toBe(8);
    expect(xpForNext(10)).toBe(26);
    expect(xpForNext(29)).toBe(64);
  });

  it("gets clearly harder from Lv.30, and again from Lv.40", () => {
    expect(xpForNext(30)).toBe(85);
    expect(xpForNext(39)).toBe(130);
    expect(xpForNext(40)).toBe(180);
    expect(xpForNext(49)).toBe(225);
    expect(xpForNext(30) / xpForNext(29)).toBeGreaterThan(1.3);
    expect(xpForNext(40) / xpForNext(39)).toBeGreaterThan(1.3);
  });
});

describe("xpToReach", () => {
  it("level 1 costs nothing", () => {
    expect(xpToReach(1)).toBe(0);
  });

  it("is the cumulative sum of xpForNext and strictly increasing", () => {
    for (let n = 1; n < MAX_LEVEL; n++) {
      expect(xpToReach(n + 1) - xpToReach(n)).toBe(xpForNext(n));
      expect(xpToReach(n + 1)).toBeGreaterThan(xpToReach(n));
    }
  });

  it("puts Lv.30 / 40 / 50 at 1,044 / 2,119 / 4,144 XP", () => {
    expect(xpToReach(30)).toBe(1044);
    expect(xpToReach(40)).toBe(2119);
    expect(xpToReach(MAX_LEVEL)).toBe(4144);
  });

  it("max level is about 70% of one grade's content XP", () => {
    // A1..C2 content XP (reading + writing + listening + grammar + vocab Days)
    for (const grade of [5810, 5690, 5850, 6100, 6020, 5910]) {
      const share = xpToReach(MAX_LEVEL) / grade;
      expect(share).toBeGreaterThan(0.66);
      expect(share).toBeLessThan(0.75);
    }
  });

  it("clamps out-of-range levels", () => {
    expect(xpToReach(0)).toBe(xpToReach(1));
    expect(xpToReach(MAX_LEVEL + 5)).toBe(xpToReach(MAX_LEVEL));
  });
});

describe("levelFromXp", () => {
  it("round-trips with xpToReach at exact thresholds", () => {
    for (let l = 1; l <= MAX_LEVEL; l++) expect(levelFromXp(xpToReach(l))).toBe(l);
  });

  it("stays on the previous level one XP short of the threshold", () => {
    for (let l = 2; l <= MAX_LEVEL; l++) expect(levelFromXp(xpToReach(l) - 1)).toBe(l - 1);
  });

  it("caps at MAX_LEVEL, starts at 1", () => {
    expect(levelFromXp(10_000_000)).toBe(MAX_LEVEL);
    expect(levelFromXp(0)).toBe(1);
  });
});

describe("levelProgress", () => {
  it("starts a fresh level at 0% and reports 100% at MAX_LEVEL", () => {
    const p = levelProgress(xpToReach(3));
    expect([p.level, p.into, p.pct]).toEqual([3, 0, 0]);
    expect(levelProgress(xpToReach(MAX_LEVEL)).pct).toBe(100);
  });

  it("never exceeds 100%", () => {
    for (let xp = 0; xp < xpToReach(MAX_LEVEL) + 1000; xp += 37) {
      expect(levelProgress(xp).pct).toBeLessThanOrEqual(100);
    }
  });
});

describe("the oak's looks", () => {
  it("changes look at Lv.3 / 7 / 13 / 21 / 33 / 50", () => {
    expect([1, 2, 3, 6, 7, 12, 13, 20, 21, 32, 33, 49, 50, 999].map(artStageForLevel)).toEqual([
      0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    ]);
  });

  it("names six stages on look boundaries, skipping the grown tree", () => {
    expect([1, 3, 7, 13, 21, 32, 33, 49, 50].map(treeStageForLevel)).toEqual([
      "A1", "A2", "B1", "B2", "B2", "B2", "C1", "C1", "C2",
    ]);
    expect(treeStageForLevel(0)).toBe("A1");
    expect(treeStageForLevel(999)).toBe("C2");
  });

  it("the last look is the max level", () => {
    expect(ART_STAGE_STARTS[ART_STAGE_STARTS.length - 1]).toBe(MAX_LEVEL);
  });
});

describe("evolutionProgress", () => {
  it("counts the XP left to the next look", () => {
    expect(evolutionProgress(0)).toEqual({ level: 1, look: 0, nextLook: 1, xpLeft: xpToReach(3), pct: 0 });
    const mid = evolutionProgress(xpToReach(13) - 10);
    expect(mid.look).toBe(2);
    expect(mid.nextLook).toBe(3);
    expect(mid.xpLeft).toBe(10);
  });

  it("stops at the Guardian Tree", () => {
    expect(evolutionProgress(xpToReach(MAX_LEVEL))).toMatchObject({ look: 6, nextLook: null, xpLeft: 0, pct: 100 });
    expect(evolutionProgress(99_999)).toMatchObject({ level: MAX_LEVEL, nextLook: null });
  });
});

describe("isDifficultyUnlocked", () => {
  it("everything at or below the tested CEFR is open", () => {
    expect(isDifficultyUnlocked("B1", "B1")).toBe(true);
    expect(isDifficultyUnlocked("A1", "C2")).toBe(true);
  });

  it("anything above the tested CEFR stays locked — player level never unlocks content", () => {
    expect(isDifficultyUnlocked("A2", "A1")).toBe(false);
    expect(isDifficultyUnlocked("C2", "C1")).toBe(false);
  });
});
