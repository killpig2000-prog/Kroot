import { describe, expect, it } from "vitest";
import {
  MIN_AVG,
  MIN_SKILL,
  PROMOTION_TESTS,
  buildServedTest,
  testForGrade,
  testVerdict,
} from "@/lib/promotion-test";
import { LEVEL_ORDER } from "@/lib/tree";

// Deterministic rng for reproducible sampling in tests.
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("promotion test content invariants", () => {
  it("covers every grade transition up to C2", () => {
    expect(PROMOTION_TESTS.map((t) => `${t.from}→${t.to}`)).toEqual([
      "A1→A2",
      "A2→B1",
      "B1→B2",
      "B2→C1",
      "C1→C2",
    ]);
    for (const t of PROMOTION_TESTS) {
      expect(LEVEL_ORDER.indexOf(t.to)).toBe(LEVEL_ORDER.indexOf(t.from) + 1);
    }
  });

  it("pools are strictly larger than what one attempt serves", () => {
    for (const t of PROMOTION_TESTS) {
      expect(t.listeningPool.length).toBeGreaterThan(t.listeningCount);
      expect(t.readingPool.length).toBeGreaterThan(t.readingCount);
      expect(t.writingPool.length).toBeGreaterThanOrEqual(2);
      expect(t.speakingPool.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every MCQ answer is one of its options, with no duplicate options", () => {
    for (const t of PROMOTION_TESTS) {
      const all = [...t.listeningPool, ...t.readingPool.flatMap((s) => s.questions)];
      for (const q of all) {
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("listening questions have Korean audio text; reading questions do not", () => {
    for (const t of PROMOTION_TESTS) {
      for (const q of t.listeningPool) expect(q.kr.length).toBeGreaterThan(0);
      for (const s of t.readingPool) {
        expect(s.passage.length).toBeGreaterThan(0);
        for (const q of s.questions) expect(q.kr).toBe("");
      }
    }
  });

  it("difficulty scales: served question volume never shrinks at higher grades", () => {
    for (let i = 1; i < PROMOTION_TESTS.length; i++) {
      const prev = PROMOTION_TESTS[i - 1];
      const cur = PROMOTION_TESTS[i];
      expect(cur.listeningCount).toBeGreaterThanOrEqual(prev.listeningCount);
    }
  });

  it("testForGrade finds each transition and returns null at the top", () => {
    expect(testForGrade("A1")?.to).toBe("A2");
    expect(testForGrade("C1")?.to).toBe("C2");
    expect(testForGrade("C2")).toBeNull();
  });
});

describe("buildServedTest", () => {
  it("serves the configured counts", () => {
    for (const t of PROMOTION_TESTS) {
      const served = buildServedTest(t, seededRng(42));
      expect(served.listening.length).toBe(t.listeningCount);
      expect(served.reading.length).toBe(t.readingCount);
      expect(t.writingPool.map((p) => p.prompt)).toContain(served.writing.prompt);
      expect(t.speakingPool.map((p) => p.prompt)).toContain(served.speaking.prompt);
    }
  });

  it("samples without duplicating questions", () => {
    const served = buildServedTest(PROMOTION_TESTS[0], seededRng(7));
    const krs = served.listening.map((q) => q.kr);
    expect(new Set(krs).size).toBe(krs.length);
  });

  it("keeps every answer valid after option shuffling", () => {
    for (let seed = 1; seed <= 5; seed++) {
      for (const t of PROMOTION_TESTS) {
        const served = buildServedTest(t, seededRng(seed));
        const all = [...served.listening, ...served.reading.flatMap((s) => s.questions)];
        for (const q of all) expect(q.options).toContain(q.answer);
      }
    }
  });

  it("different seeds produce different tests", () => {
    const a = buildServedTest(PROMOTION_TESTS[2], seededRng(1));
    const b = buildServedTest(PROMOTION_TESTS[2], seededRng(999));
    const sig = (s: typeof a) =>
      JSON.stringify([s.listening.map((q) => q.kr), s.reading.map((r) => r.passage), s.writing.prompt]);
    expect(sig(a)).not.toBe(sig(b));
  });

  it("does not mutate the spec's pools", () => {
    const t = PROMOTION_TESTS[0];
    const before = JSON.stringify(t);
    buildServedTest(t, seededRng(3));
    expect(JSON.stringify(t)).toBe(before);
  });
});

describe("testVerdict", () => {
  it("passes only with every skill ≥ MIN_SKILL and average ≥ MIN_AVG", () => {
    expect(testVerdict({ listening: 70, reading: 70, writing: 70, speaking: 70 }).passed).toBe(true);
    // high average but one skill below the floor fails
    expect(
      testVerdict({ listening: 100, reading: 100, writing: 100, speaking: MIN_SKILL - 1 }).passed
    ).toBe(false);
    // all above the floor but average below MIN_AVG fails
    expect(testVerdict({ listening: 60, reading: 60, writing: 60, speaking: 60 }).passed).toBe(
      60 >= MIN_AVG
    );
  });

  it("identifies the weakest skill", () => {
    expect(testVerdict({ listening: 90, reading: 40, writing: 80, speaking: 70 }).weakest).toBe(
      "reading"
    );
  });
});
