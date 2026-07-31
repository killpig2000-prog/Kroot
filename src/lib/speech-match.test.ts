import { describe, expect, it } from "vitest";
import { bestSimilarity, normalizeKr, similarity, verdictFor } from "@/lib/speech-match";

describe("normalizeKr", () => {
  it("strips punctuation and whitespace", () => {
    expect(normalizeKr("안녕하세요!")).toBe("안녕하세요");
    expect(normalizeKr("네, 맞아요.")).toBe("네맞아요");
    expect(normalizeKr("잘  지냈어요 ?".replace("?", ""))).toBe("잘지냈어요");
  });

  it("lowercases latin characters", () => {
    expect(normalizeKr("OK 좋아요")).toBe("ok좋아요");
  });
});

describe("similarity", () => {
  it("is 1 for identical strings modulo punctuation/spacing", () => {
    expect(similarity("안녕하세요", "안녕하세요!")).toBe(1);
    expect(similarity("잘 지냈어요", "잘지냈어요")).toBe(1);
  });

  it("is 1 when both normalize to empty", () => {
    expect(similarity("!!", "  ")).toBe(1);
  });

  it("is 0 when only one side is empty", () => {
    expect(similarity("", "안녕")).toBe(0);
  });

  it("drops as strings diverge", () => {
    const close = similarity("안녕하세요", "안녕하세여");
    const far = similarity("안녕하세요", "감사합니다");
    expect(close).toBeGreaterThan(far);
    expect(close).toBeGreaterThanOrEqual(0.8);
  });
});

describe("bestSimilarity", () => {
  it("takes the best match across accepted answers", () => {
    const score = bestSimilarity("괜찮아요", ["잘 지냈어요", "괜찮아요"]);
    expect(score).toBe(1);
  });

  it("is 0 with no answers", () => {
    expect(bestSimilarity("안녕", [])).toBe(0);
  });
});

describe("verdictFor", () => {
  it("uses the 0.8 / 0.5 thresholds", () => {
    expect(verdictFor(1)).toBe("great");
    expect(verdictFor(0.8)).toBe("great");
    expect(verdictFor(0.79)).toBe("close");
    expect(verdictFor(0.5)).toBe("close");
    expect(verdictFor(0.49)).toBe("again");
    expect(verdictFor(0)).toBe("again");
  });
});
