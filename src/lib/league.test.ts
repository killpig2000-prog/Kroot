import { describe, expect, it } from "vitest";
import { LEAGUE_TIERS, leagueTier } from "@/lib/league";

describe("leagueTier", () => {
  it("maps each in-range value to the matching tier", () => {
    LEAGUE_TIERS.forEach((tier, i) => {
      expect(leagueTier(i)).toBe(tier);
    });
  });

  it("defaults null/undefined to the bottom tier", () => {
    expect(leagueTier(null)).toBe(LEAGUE_TIERS[0]);
    expect(leagueTier(undefined)).toBe(LEAGUE_TIERS[0]);
  });

  it("clamps out-of-range values instead of throwing", () => {
    expect(leagueTier(-1)).toBe(LEAGUE_TIERS[0]);
    expect(leagueTier(999)).toBe(LEAGUE_TIERS[LEAGUE_TIERS.length - 1]);
  });
});
