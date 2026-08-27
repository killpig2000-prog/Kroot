import { describe, expect, it } from "vitest";
import {
  FULLY_GROWN_LEVEL,
  MAX_LEVEL,
  isDifficultyUnlocked,
  levelFromXp,
  levelProgress,
  treeHeightMetres,
  treeStageForLevel,
  veteranTiers,
  xpForNext,
  xpToReach,
} from "@/lib/level";

describe("xpForNext (curve v2)", () => {
  it("one chapter is one level-up for the first ten levels", () => {
    for (let l = 1; l < 10; l++) expect(xpForNext(l)).toBe(10);
  });

  it("ramps in tiers up to fully grown", () => {
    expect(xpForNext(10)).toBe(15);
    expect(xpForNext(19)).toBe(15);
    expect(xpForNext(20)).toBe(25);
    expect(xpForNext(34)).toBe(25);
    expect(xpForNext(35)).toBe(40);
    expect(xpForNext(49)).toBe(40);
  });

  it("keeps rising slowly past fully grown", () => {
    expect(xpForNext(50)).toBe(80);
    expect(xpForNext(51)).toBe(84);
    expect(xpForNext(100)).toBe(280);
  });
});

describe("xpToReach", () => {
  it("level 1 costs nothing", () => {
    expect(xpToReach(1)).toBe(0);
  });

  it("is strictly increasing up to MAX_LEVEL", () => {
    for (let l = 1; l < MAX_LEVEL; l++) {
      expect(xpToReach(l + 1)).toBeGreaterThan(xpToReach(l));
    }
  });

  it("is the cumulative sum of xpForNext", () => {
    for (let n = 1; n < MAX_LEVEL; n++) {
      expect(xpToReach(n + 1) - xpToReach(n)).toBe(xpForNext(n));
    }
  });

  it("fully grown at 1,215 XP (~100 chapters)", () => {
    expect(xpToReach(FULLY_GROWN_LEVEL)).toBe(1215);
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

  it("a single grammar chapter (10 XP) levels a new learner up", () => {
    expect(levelFromXp(10)).toBe(2);
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
  it("evolves every 10 levels and parks at the last stage from 50", () => {
    expect(treeStageForLevel(1)).toBe("A1");
    expect(treeStageForLevel(9)).toBe("A1");
    expect(treeStageForLevel(10)).toBe("A2");
    expect(treeStageForLevel(29)).toBe("B1");
    expect(treeStageForLevel(30)).toBe("B2");
    expect(treeStageForLevel(40)).toBe("C1");
    expect(treeStageForLevel(50)).toBe("C2");
    expect(treeStageForLevel(120)).toBe("C2");
  });

  it("clamps weird inputs to the first/last stage", () => {
    expect(treeStageForLevel(0)).toBe("A1");
    expect(treeStageForLevel(999)).toBe("C2");
  });
});

describe("veteran growth", () => {
  it("adds a canopy tier every 10 levels past fully grown", () => {
    expect(veteranTiers(49)).toBe(0);
    expect(veteranTiers(50)).toBe(0);
    expect(veteranTiers(60)).toBe(1);
    expect(veteranTiers(73)).toBe(2);
    expect(veteranTiers(120)).toBe(7);
    expect(veteranTiers(500)).toBe(7);
  });

  it("measures height only from fully grown", () => {
    expect(treeHeightMetres(30)).toBe(0);
    expect(treeHeightMetres(50)).toBe(2);
    expect(treeHeightMetres(73)).toBe(4.9);
    expect(treeHeightMetres(120)).toBe(10.8);
  });
});

describe("isDifficultyUnlocked", () => {
  it("everything at or below the tested CEFR is open", () => {
    expect(isDifficultyUnlocked("B1", "B1")).toBe(true);
    expect(isDifficultyUnlocked("A1", "C2")).toBe(true);
  });

  it("anything above the tested CEFR stays locked — player level never unlocks content", () => {
    expect(isDifficultyUnlocked("A2", "A1")).toBe(false);
    expect(isDifficultyUnlocked("B1", "A2")).toBe(false);
    expect(isDifficultyUnlocked("C2", "C1")).toBe(false);
  });
});
