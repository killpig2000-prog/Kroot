import { describe, expect, it } from "vitest";
import {
  MAX_LEVEL,
  isDifficultyUnlocked,
  levelFromXp,
  levelProgress,
  treeStageForLevel,
  xpToReach,
} from "@/lib/level";

describe("xpToReach", () => {
  it("level 1 costs nothing", () => {
    expect(xpToReach(1)).toBe(0);
  });

  it("is strictly increasing up to MAX_LEVEL", () => {
    for (let l = 1; l < MAX_LEVEL; l++) {
      expect(xpToReach(l + 1)).toBeGreaterThan(xpToReach(l));
    }
  });

  it("matches the per-level formula 50 + 10n cumulatively", () => {
    // going from n to n+1 costs 50 + 10n
    for (let n = 1; n < MAX_LEVEL; n++) {
      expect(xpToReach(n + 1) - xpToReach(n)).toBe(50 + 10 * n);
    }
  });

  it("clamps out-of-range levels", () => {
    expect(xpToReach(0)).toBe(xpToReach(1));
    expect(xpToReach(MAX_LEVEL + 5)).toBe(xpToReach(MAX_LEVEL));
  });
});

describe("levelFromXp", () => {
  it("round-trips with xpToReach at exact thresholds", () => {
    for (let l = 1; l <= MAX_LEVEL; l++) {
      expect(levelFromXp(xpToReach(l))).toBe(l);
    }
  });

  it("stays on the previous level one XP short of the threshold", () => {
    for (let l = 2; l <= MAX_LEVEL; l++) {
      expect(levelFromXp(xpToReach(l) - 1)).toBe(l - 1);
    }
  });

  it("caps at MAX_LEVEL for huge XP", () => {
    expect(levelFromXp(10_000_000)).toBe(MAX_LEVEL);
  });

  it("is level 1 at zero XP", () => {
    expect(levelFromXp(0)).toBe(1);
  });
});

describe("levelProgress", () => {
  it("starts a fresh level at 0%", () => {
    const p = levelProgress(xpToReach(3));
    expect(p.level).toBe(3);
    expect(p.into).toBe(0);
    expect(p.pct).toBe(0);
  });

  it("reports 100% at MAX_LEVEL", () => {
    const p = levelProgress(xpToReach(MAX_LEVEL));
    expect(p.level).toBe(MAX_LEVEL);
    expect(p.pct).toBe(100);
  });

  it("never exceeds 100%", () => {
    for (let xp = 0; xp < xpToReach(MAX_LEVEL) + 1000; xp += 137) {
      expect(levelProgress(xp).pct).toBeLessThanOrEqual(100);
    }
  });
});

describe("treeStageForLevel", () => {
  it("evolves every 5 levels", () => {
    expect(treeStageForLevel(1)).toBe("A1");
    expect(treeStageForLevel(5)).toBe("A1");
    expect(treeStageForLevel(6)).toBe("A2");
    expect(treeStageForLevel(15)).toBe("B1");
    expect(treeStageForLevel(16)).toBe("B2");
    expect(treeStageForLevel(26)).toBe("C2");
    expect(treeStageForLevel(30)).toBe("C2");
  });

  it("clamps weird inputs to the first/last stage", () => {
    expect(treeStageForLevel(0)).toBe("A1");
    expect(treeStageForLevel(99)).toBe("C2");
  });
});

describe("isDifficultyUnlocked", () => {
  it("everything at or below the tested CEFR is open regardless of level", () => {
    expect(isDifficultyUnlocked("B1", 1, "B1")).toBe(true);
    expect(isDifficultyUnlocked("A1", 1, "C2")).toBe(true);
  });

  it("harder tiers gate on player level", () => {
    expect(isDifficultyUnlocked("B1", 7, "A1")).toBe(false);
    expect(isDifficultyUnlocked("B1", 8, "A1")).toBe(true);
    expect(isDifficultyUnlocked("C2", 25, "A1")).toBe(false);
    expect(isDifficultyUnlocked("C2", 26, "A1")).toBe(true);
  });
});
