import { describe, expect, it } from "vitest";
import { isPlus } from "@/lib/plus";

describe("isPlus", () => {
  it("is false for null/undefined", () => {
    expect(isPlus(null)).toBe(false);
    expect(isPlus(undefined)).toBe(false);
  });

  it("is true when plus_until is in the future", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isPlus(future)).toBe(true);
  });

  it("is false when plus_until is in the past", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isPlus(past)).toBe(false);
  });
});
